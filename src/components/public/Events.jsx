'use client'
import { useState } from 'react'

const eventsData = [
  { category: 'September Events', events: [{ title: 'Athletics Club Hill Run', date: '2025-09-19', description: 'A challenging hill running event where students test their endurance, speed, and stamina.' }, { title: 'Interhouse Competitions', date: '2025-09-29', description: 'A day of spirited rivalry where school houses compete in various activities, showcasing talent, teamwork, and school spirit.' }] },
  { category: 'October Events', events: [{ title: 'Breast Cancer Awareness Day', date: '2025-10-05', description: 'A day dedicated to raising awareness about breast cancer through educational talks, pink-themed activities, and community support initiatives.' }, { title: 'External Examinations', date: '2025-10-13', description: 'O Level examinations for all Form 4 students begin, assessing knowledge and academic preparedness.' }] },
  { category: 'November Events', events: [{ title: 'Internal Examinations', date: '2025-11-10', description: 'End-of-year internal examinations for students in Forms 1 to 3 across all subjects.' }, { title: "Form 4 Leavers' Prom Night", date: '2025-11-21', description: 'A memorable evening where Form 4 students celebrate the end of their secondary school journey with music, dancing, and formal elegance.' }, { title: 'Speech and Accolades Day', date: '2025-11-28', description: 'A formal ceremony celebrating academic achievements, sporting excellence, and contributions to school life.' }] },
  { category: 'December Events', events: [{ title: 'National Tree Planting Day', date: '2025-12-06', description: 'An environmental initiative promoting sustainability where students and staff participate in tree planting activities.' }] },
]

const Events = () => {
  const [activeCategory, setActiveCategory] = useState(eventsData[0].category)

  const categoryData = eventsData.find(d => d.category === activeCategory)

  return (
    <div className="container mx-auto px-4 py-16">
      <h2 className="text-4xl font-bold text-center mb-12 text-indigo-900">Upcoming Events</h2>
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {eventsData.map((data, index) => (
          <button
            key={index}
            className={`px-6 py-3 rounded-full transition-all duration-300 ${activeCategory === data.category ? 'bg-indigo-700 text-white font-bold shadow-lg' : 'bg-white text-indigo-700 hover:bg-indigo-100'}`}
            onClick={() => setActiveCategory(data.category)}
          >
            {data.category}
          </button>
        ))}
      </div>
      {categoryData ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryData.events.map((event, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-6">
                <h4 className="text-xl font-bold mb-2 text-indigo-700">{event.title}</h4>
                <p className="text-gray-600 mb-3 text-sm">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-gray-700">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">No events found for this category.</p>
      )}
    </div>
  )
}

export default Events
