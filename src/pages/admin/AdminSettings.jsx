import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/admin/AdminSidebar'

export function AdminSettings() {

  // Platform Info States
  const [platformName, setPlatformName] = useState('eduroot')
  const [supportEmail, setSupportEmail] = useState('support@eduroot.online')
  const [infoSaving, setInfoSaving] = useState(false)

  // Admin Change Password States
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    const fetchPlatformSettings = async () => {
      try {
        setLoadingSettings(true)
        const { data, error } = await supabase
          .from('platform_settings')
          .select('key, value')

        if (error) throw error
        data?.forEach(item => {
          if (item.key === 'platform_name') {
            setPlatformName(item.value || 'eduroot')
          } else if (item.key === 'support_email') {
            setSupportEmail(item.value || 'support@eduroot.online')
          }
        })
      } catch (err) {
        console.error('AdminSettings: Failed to load config:', err)
        toast.error('Failed to load system settings.')
      } finally {
        setLoadingSettings(false)
      }
    }

    fetchPlatformSettings()
  }, [])

  const handleSavePlatformInfo = async (e) => {
    e.preventDefault()
    if (!platformName.trim() || !supportEmail.trim()) {
      toast.error('All fields are required.')
      return
    }

    setInfoSaving(true)
    try {
      const { error: nameErr } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'platform_name',
          value: platformName.trim()
        }, { onConflict: 'key' })

      if (nameErr) throw nameErr

      const { error: emailErr } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'support_email',
          value: supportEmail.trim()
        }, { onConflict: 'key' })

      if (emailErr) throw emailErr

      toast.success('Settings saved!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save platform settings.')
    } finally {
      setInfoSaving(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password updated!')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  // Styles helpers
  const inputStyle = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#111111] bg-white placeholder:text-gray-400 focus:outline-none focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/10 transition-all duration-200"

  return (
    <div className="flex min-h-screen bg-[#F8F6F2]">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-60 transition-all text-left">
        
        {/* Header bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-5 select-none">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#111111]">Settings</h1>
            <span className="text-xs text-[#5F6368] mt-0.5">
              Admin / Settings
            </span>
          </div>
        </header>

        {loadingSettings ? (
          <div className="min-h-[75vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F3D2E]" />
              <span className="text-sm font-semibold text-[#0F3D2E]">Loading configurations...</span>
            </div>
          </div>
        ) : (
          <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">

            {/* SECTION 2: PLATFORM INFO */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-base font-semibold mb-5 text-[#111111] select-none">Platform Info</h3>

              <form onSubmit={handleSavePlatformInfo} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block select-none">Platform name</label>
                    <input
                      type="text"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      placeholder="eg. eduroot"
                      className={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block select-none">Support email</label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="eg. support@eduroot.online"
                      className={inputStyle}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-2 select-none">
                  <button
                    type="submit"
                    disabled={infoSaving}
                    className="bg-[#0F3D2E] hover:bg-[#1a5c44] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {infoSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>Save Platform Settings</span>
                  </button>
                </div>
              </form>
            </div>

            {/* SECTION 3: ADMIN ACCOUNT PASSWORD */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-base font-semibold mb-5 text-[#111111] select-none">Admin Account</h3>

              <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block select-none">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className={`${inputStyle} pr-10`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block select-none">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className={`${inputStyle} pr-10`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-[11px] text-red-500 font-medium mt-1.5 ml-1 select-none">
                      {passwordError}
                    </p>
                  )}
                </div>

                <div className="flex justify-end mt-2 select-none">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="bg-[#0F3D2E] hover:bg-[#1a5c44] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {passwordSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}

export default AdminSettings
