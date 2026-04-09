'use client'

// React Imports
import { useRef, useState } from 'react'

// FullCalendar Imports
import esLocale from '@fullcalendar/core/locales/es'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'

// MUI Imports
import Card from '@mui/material/Card'

// Component Imports
import EventDialog from './EventDialog'

// Style Imports
import AppFullCalendar from '@/libs/styles/AppFullCalendar'

// Types & Services
import { usePermissions } from '@/hooks/usePermissions'
import { AgendaEvent, getEvents } from '@/services/agendaService'

const AgendaCalendar = () => {
  // States
  const [events, setEvents] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  
  // Refs
  const calendarRef = useRef<any>(null)

  // Permissions
  const { hasPermission, isSuperAdmin, user } = usePermissions()
  
  const canCreate = isSuperAdmin || hasPermission('agenda.eventos.crear')
  const canEdit = isSuperAdmin || hasPermission('agenda.eventos.editar')
  const canDelete = isSuperAdmin || hasPermission('agenda.eventos.eliminar')

  const fetchEvents = async (start: Date, end: Date) => {
    try {
      const data = await getEvents(start.toISOString(), end.toISOString())
      // Map backend fields to FullCalendar fields
      const formattedEvents = data.map((e: AgendaEvent) => ({
        id: e.id?.toString(),
        title: e.title,
        start: e.start_date,
        end: e.end_date,
        allDay: e.all_day,
        url: e.event_url,
        classNames: [`event-bg-${e.color || 'primary'}`],
        extendedProps: { ...e }
      }))
      setEvents(formattedEvents)
    } catch (error) {
      console.error('Error fetching events', error)
    }
  }

  const handleDatesSet = (dateInfo: any) => {
    fetchEvents(dateInfo.start, dateInfo.end)
  }

  const handleEventClick = (clickInfo: any) => {
    clickInfo.jsEvent.preventDefault() // Prevent browser navigation to URL
    const event = clickInfo.event.extendedProps as AgendaEvent
    // FullCalendar stores the ID in the main object, but we mapped extendedProps
    setSelectedEvent({ ...event, id: Number(clickInfo.event.id) })
    setDialogOpen(true)
  }

  const handleDateClick = (arg: any) => {
    if (!canCreate) return
    
    const isAllDay = arg.allDay
    let startDate: Date
    let endDate: Date

    if (isAllDay) {
        // Treat dateStr (YYYY-MM-DD) as local midnight by appending T00:00:00
        // new Date("2025-12-30") is UTC, but new Date("2025-12-30T00:00:00") is local
        startDate = new Date(`${arg.dateStr}T00:00:00`)
        // Default end date is same day for 1-day event
        endDate = new Date(`${arg.dateStr}T23:59:59`)
    } else {
        startDate = arg.date
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
    }
    
    setSelectedEvent({
        title: '',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        color: 'primary',
        all_day: isAllDay,
        event_url: ''
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedEvent(null)
  }

  const refetch = () => {
      const calendarApi = calendarRef.current?.getApi()
      if (calendarApi) {
          fetchEvents(calendarApi.view.activeStart, calendarApi.view.activeEnd)
      }
  }

  return (
    <Card>
      <AppFullCalendar className='app-calendar'>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView='dayGridMonth'
          headerToolbar={{
            start: 'prev,next title',
            center: '',
            end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
          }}
          locale={esLocale}
          editable={canEdit}
          selectable={canCreate}
          events={events} // Pass the state directly
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height={800}
        />
      </AppFullCalendar>
      
      {dialogOpen && (
        <EventDialog
            open={dialogOpen}
            handleClose={handleCloseDialog}
            event={selectedEvent}
            refetchEvents={refetch}
            currentUserCanEdit={canEdit && (!selectedEvent?.id || selectedEvent.created_by === user?.id)}
            currentUserCanDelete={canDelete && (!selectedEvent?.id || selectedEvent.created_by === user?.id)}
        />
      )}
    </Card>
  )
}

export default AgendaCalendar
