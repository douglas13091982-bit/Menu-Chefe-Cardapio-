// @ts-nocheck -- código original migrado sem alterações de lógica
import { useState } from 'react'
import { CheckCircle2, Store, Clock3, Truck, Eye, ShieldCheck, AlertTriangle, MapPin, Phone, Tag, Volume2, Play, Music, Printer } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { supabase } from '@/integrations/supabase/client'
import { DAY_LABELS, DAY_ORDER, getWeeklyHours, getStoreStatus } from '../../hours'
import MapboxIntegration from './MapboxIntegration'
import { money } from '../../format'
import { compressImageToWebP, isImageFile } from '@/lib/image-compress'

function SettingsPanel() {
  const { config, setConfig } = useStore()
  const [formData, setFormData] = useState(config)
  const [saved, setSaved] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [compressingLogo, setCompressingLogo] = useState(false)
  const [compressingBanner, setCompressingBanner] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!isImageFile(file)) {
      alert('Por favor, selecione um arquivo de imagem (PNG, JPG, WebP...)')
      return
    }
    setCompressingLogo(true)
    try {
      const result = await compressImageToWebP(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
      })
      setFormData(prev => ({ ...prev, logoUrl: result.dataUrl! }))
    } catch (err: any) {
      alert(err?.message || 'Não foi possível processar a logo.')
    } finally {
      setCompressingLogo(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!isImageFile(file)) {
      alert('Por favor, selecione um arquivo de imagem (PNG, JPG, WebP...)')
      return
    }
    setCompressingBanner(true)
    try {
      const result = await compressImageToWebP(file, {
        maxWidth: 1600,
        maxHeight: 900,
        quality: 0.8,
      })
      setFormData(prev => ({ ...prev, bannerImage: result.dataUrl! }))
    } catch (err: any) {
      alert(err?.message || 'Não foi possível processar a imagem do banner.')
    } finally {
      setCompressingBanner(false)
    }
  }

  // REST OF FILE LOADED FROM ARTIFACT - will complete in next call
