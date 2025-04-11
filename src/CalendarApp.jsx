import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CalendarApp() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const validLogins = [
    { username: import.meta.env.VITE_USER_1, password: import.meta.env.VITE_PASS_1 },
    { username: import.meta.env.VITE_USER_2, password: import.meta.env.VITE_PASS_2 },
  ];


  useEffect(() => {
    const sheetUrl = import.meta.env.VITE_SHEET_URL;
    const sheetId = sheetUrl.split("/d/")[1].split("/")[0];

    const fetchAllFromUkupno = async () => {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Ukupno`;
      try {
        const res = await fetch(url);
        const text = await res.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));

        const allRows = [];

        json.table.rows.forEach((row) => {
          const datum = row.c[0]?.f;
          const klijent = row.c[1]?.v || "";
          const opis = row.c[2]?.v || "";
          const kontakt = row.c[3]?.v || "";
          const napomena = row.c[4]?.v || "";

          const formattedDate = formatDate(datum);
          if (!formattedDate || !opis) return;

          allRows.push({
            title: `${klijent ? klijent + " - " : ""}${opis}`,
            date: formattedDate,
            extendedProps: {
              kontakt,
              napomena,
              klijent,
              opis,
            },
          });
        });

        setEvents(allRows);
        console.log("Učitano događaja:", allRows.length);
      } catch (e) {
        console.error("Greška pri učitavanju 'Ukupno' taba:", e);
      }
    };

    if (isLoggedIn) fetchAllFromUkupno();
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();

    const isValid = validLogins.some(
      (u) =>
        u.username === loginData.username &&
        u.password === loginData.password
    );

    if (isValid) {
      setIsLoggedIn(true);
    } else {
      alert("Pogrešno korisničko ime ili lozinka");
    }
  };

  const formatDate = (input) => {
    const [month, day, year] = input.split('/');
    if (!month || !day || !year) return null;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; // yyyy-mm-dd
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event.extendedProps);
  };

  const closeModal = () => setSelectedEvent(null);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">Prijava</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-2 w-64">
          <input
            type="text"
            placeholder="Korisničko ime"
            value={loginData.username}
            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Lozinka"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            className="border p-2 rounded"
          />
          <button type="submit" className="bg-blue-600 text-white rounded p-2">
            Prijavi se
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">📅 Kalendar događaja</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        height="auto"
      />

      {/* <div className="mt-4 text-center">
        <a
          href={import.meta.env.VITE_SHEET_EDITOR}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          👉 Otvori Google Sheet za uređivanje podataka
        </a>
      </div> */}

      {selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
          <div className="relative bg-yellow-100 p-6 rounded shadow-md w-full max-w-md z-10">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✖
            </button>
            <h2 className="text-lg font-bold mb-2">Detalji događaja</h2>
            <p><strong>Klijent:</strong> {selectedEvent.klijent}</p>
            <p><strong>Opis:</strong> {selectedEvent.opis}</p>
            <p><strong>Kontakt:</strong> {selectedEvent.kontakt}</p>
            <p><strong>Napomena:</strong> {selectedEvent.napomena}</p>
          </div>
        </div>
      )}
    </div>
  );
}
