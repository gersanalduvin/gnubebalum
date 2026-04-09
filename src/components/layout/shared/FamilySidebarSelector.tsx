'use client'

import { i18n } from '@/configs/i18n'
import { ParentAccessService } from '@/services/parentAccessService'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Typography from '@mui/material/Typography'

import { usePermissions } from '@/hooks/usePermissions'

const FamilySidebarSelector = () => {
    const { user } = usePermissions()
    const params = useParams()
    const router = useRouter()
    const pathname = usePathname()
    const [children, setChildren] = useState<any[]>([])
    const [selectedChildId, setSelectedChildId] = useState<string>('')

    const locale = (params?.lang as string) || i18n.defaultLocale
    const lang = i18n.locales.includes(locale as any) ? locale : i18n.defaultLocale

    useEffect(() => {
        if (user?.tipo_usuario !== 'familia') return;

        const fetchChildren = async () => {
            try {
                const data = await ParentAccessService.getChildren()
                setChildren(data)

                if (params?.studentId) {
                   setSelectedChildId(params.studentId as string)
                }
            } catch (error) {
                console.error("Error fetching children for sidebar", error)
            }
        }
        fetchChildren()
    }, [user, params?.studentId, pathname])

    const handleChange = (event: SelectChangeEvent) => {
        const newId = event.target.value
        setSelectedChildId(newId)
        router.push(`/${lang}/portal/familia/hijo/${newId}`)
    }

    // Only render for family users
    if (user?.tipo_usuario !== 'familia') return null
    if (children.length === 0) return null

    const selectedChild = children.find(c => c.id.toString() === selectedChildId)

    return (
        <Box sx={{ px: 3, pt: 2, pb: 3, borderBottom: '1px solid var(--mui-palette-divider)' }}>
            {/* Selected Child Mini-Card */}
            {selectedChild ? (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'primary.lighter',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Avatar
                        src={selectedChild.foto_url}
                        alt={selectedChild.nombre_completo}
                        sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'primary.main',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                        }}
                    >
                        {selectedChild.nombre_completo?.charAt(0)}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 600,
                                lineHeight: 1.2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {selectedChild.nombre_completo.split(' ').slice(0, 2).join(' ')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {selectedChild.grado}
                        </Typography>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Seleccionar Estudiante
                    </Typography>
                </Box>
            )}

            {/* Selector Dropdown */}
            {children.length > 1 && (
                <FormControl fullWidth size="small">
                    <Select
                        value={selectedChildId}
                        onChange={handleChange}
                        displayEmpty
                        renderValue={(selected) => {
                            if (!selected) {
                                return <em style={{ color: 'var(--mui-palette-text-secondary)' }}>Seleccionar...</em>
                            }
                            return "Cambiar estudiante"
                        }}
                        sx={{
                            borderRadius: 2,
                            '& .MuiSelect-select': {
                                py: 1,
                                fontSize: '0.8125rem',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'divider',
                            },
                        }}
                    >
                        <MenuItem disabled value="">
                            <em>Seleccione un estudiante</em>
                        </MenuItem>
                        {children.map((child) => (
                            <MenuItem key={child.id} value={child.id.toString()}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar
                                        src={child.foto_url}
                                        sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.main', color: 'white' }}
                                    >
                                        {child.nombre_completo?.charAt(0)}
                                    </Avatar>
                                    <Box>
                                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                                            {child.nombre_completo.split(' ').slice(0, 2).join(' ')}
                                        </Typography>
                                        <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.65rem' }}>
                                            {child.grado}
                                        </Typography>
                                    </Box>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Box>
    )
}

export default FamilySidebarSelector
