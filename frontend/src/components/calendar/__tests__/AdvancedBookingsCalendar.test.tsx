import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import AdvancedBookingsCalendar, { CalendarEvent } from "../../calendar/AdvancedBookingsCalendar"

describe("AdvancedBookingsCalendar", () => {
  const baseDate = new Date("2024-08-10T00:00:00Z")

  const events: CalendarEvent[] = [
    { id: 1, date: baseDate, title: "WO-1", category: "work" },
    { id: 2, date: baseDate, title: "MI-1", category: "moveIn" },
    { id: 3, date: baseDate, title: "MO-1", category: "moveOut" },
    { id: 4, date: baseDate, title: "NT-1", category: "note" },
  ]

  it("renders badges with overflow for a busy day", () => {
    render(<AdvancedBookingsCalendar events={events} initialDate={baseDate} />)

    // day number should appear
    expect(screen.getAllByText("10")[0]).toBeInTheDocument()

    // we should see at least three category labels (work, moveIn, moveOut)
    expect(screen.getByText(/work/i)).toBeInTheDocument()
    expect(screen.getByText(/moveIn/i)).toBeInTheDocument()
    expect(screen.getByText(/moveOut/i)).toBeInTheDocument()

    // overflow indicator because 4th entry exists
    expect(screen.getByText(/more/)).toBeInTheDocument()
  })

  it("emits onSelectDate and shows day details", () => {
    const onSelectDate = jest.fn()
    render(
      <AdvancedBookingsCalendar
        events={events}
        initialDate={baseDate}
        onSelectDate={onSelectDate}
      />
    )

    // click on day cell (we click the first occurrence of 10)
    fireEvent.click(screen.getAllByText("10")[0])
    expect(onSelectDate).toHaveBeenCalled()

    // selected day panel should show one of the event titles
    expect(screen.getByText(/WO-1/)).toBeInTheDocument()
  })
})


