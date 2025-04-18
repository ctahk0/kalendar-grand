import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
// import srLocale from "@fullcalendar/core/locales/sr";
const srLatinLocale = {
  code: "sr-latin",
  week: {
    dow: 1, // ponedjeljak kao prvi dan
    doy: 7,
  },
  buttonText: {
    today: "Danas",
    month: "Mjesec",
    week: "Nedjelja",
    day: "Dan",
    list: "Lista",
  },
  weekText: "Sed",
  allDayText: "Cijeli dan",
  moreLinkText: (n) => `+ još ${n}`,
  noEventsText: "Nema događaja za prikaz",
  dayNames: [
    "Nedjelja",
    "Ponedjeljak",
    "Utorak",
    "Srijeda",
    "Četvrtak",
    "Petak",
    "Subota",
  ],
  dayNamesShort: ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"],
  monthNames: [
    "Januar",
    "Februar",
    "Mart",
    "April",
    "Maj",
    "Jun",
    "Jul",
    "Avgust",
    "Septembar",
    "Oktobar",
    "Novembar",
    "Decembar",
  ],
  monthNamesShort: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Maj",
    "Jun",
    "Jul",
    "Avg",
    "Sep",
    "Okt",
    "Nov",
    "Dec",
  ],
};

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
    const savedLogin = localStorage.getItem("loggedIn");
    if (savedLogin === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const sheetUrl = import.meta.env.VITE_SHEET_URL;
    const sheetId = sheetUrl.split("/d/")[1]?.split("/")[0];
    if (!sheetId) return;

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
          const potvrda = row.c[5]?.v || "";

          const formattedDate = formatDate(datum);
          if (
            !formattedDate ||
            !(
              klijent.trim() ||
              opis.trim() ||
              kontakt.trim() ||
              napomena.trim() ||
              potvrda.trim()
            )
          ) {
            return;
          }

          const isPotvrda = potvrda?.toLowerCase?.() === "da";

          // Glavni event
          allRows.push({
            title: `${klijent ? klijent + " - " : ""}${opis}`,
            date: formattedDate,
            extendedProps: {
              kontakt,
              napomena,
              klijent,
              opis,
              potvrda,
            },
          });

          // Ako je potvrđeno — dodatni background event
          if (isPotvrda) {
            allRows.push({
              start: formattedDate,
              end: formattedDate,
              display: "background",
              backgroundColor: "#ff4d4f", // svijetlocrvena
            });
          }
        });


        setEvents(allRows);
        console.log("✅ Učitano događaja:", allRows.length);
      } catch (e) {
        console.error("❌ Greška pri učitavanju 'Ukupno' taba:", e);
      }
    };

    fetchAllFromUkupno(); // odmah učitaj

    const interval = setInterval(fetchAllFromUkupno, 60000); // svakih 60s
    return () => clearInterval(interval); // očisti na unmount
  }, [isLoggedIn]);

  const formatDate = (input) => {
    const [month, day, year] = input.split('/');
    if (!month || !day || !year) return null;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const isValid = validLogins.some(
      (u) => u.username === loginData.username && u.password === loginData.password
    );

    if (isValid) {
      setIsLoggedIn(true);
      localStorage.setItem("loggedIn", "true");
    } else {
      alert("Pogrešno korisničko ime ili lozinka");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    setIsLoggedIn(false);
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">📅 Kalendar događaja</h1>
        <button onClick={handleLogout} className="text-sm text-red-600 underline">Odjavi se</button>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        height="auto"
        firstDay={1}
        locale={srLatinLocale}
      />

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
            <p>
              <strong>Potvrđeno:</strong>{" "}
              <span className={selectedEvent.potvrda?.toLowerCase?.() === "da" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {selectedEvent.potvrda?.toLowerCase?.() === "da" ? "DA" : "NE"}
              </span>
            </p>

          </div>
        </div>
      )}
    </div>
  );
}
