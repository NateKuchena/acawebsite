const Students = () => (
  <div className="container mx-auto px-4 py-16 bg-gray-100">
    <section className="mb-20 bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-semibold mb-6 text-center text-indigo-700">Extracurricular Activities</h2>
      <p className="text-xl text-gray-600 text-center mb-8">Our students engage in a variety of extracurricular activities including:</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Soccer', 'VolleyBall', 'HandBall', 'BasketBall', 'NetBall', 'BaseBall'].map((activity, index) => (
          <div key={index} className="bg-indigo-100 rounded-lg p-4 text-center">
            <span className="text-lg font-medium text-indigo-700">{activity}</span>
          </div>
        ))}
      </div>
    </section>

    <section className="mb-20 bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-semibold mb-6 text-center text-indigo-700">Clubs and Societies</h2>
      <p className="text-xl text-gray-600 text-center mb-8">Students can join various clubs and societies to explore their interests:</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Athletics Club', 'Boy Scouts', 'Chess', 'Choir', 'Drama', 'Darts Club', 'Debate Club', 'Environmental Club', 'Girl Guides', 'Spelling Bee'].map((club, index) => (
          <div key={index} className="bg-green-100 rounded-lg p-4 text-center">
            <span className="text-lg font-medium text-green-700">{club}</span>
          </div>
        ))}
      </div>
    </section>

    <section className="mb-20">
      <h2 className="text-3xl font-semibold mb-6 text-center text-indigo-700">Achievements</h2>
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <ul className="space-y-4">
          {[
            { name: 'Admire Nkala', achievement: 'Best Performing Student in ZIMSEC Ordinary Level Examinations (November 2025)' },
            { name: 'Sositina Vheremu', achievement: 'Gold Medalist – Provincial Athletics (2025)' },
            { name: 'Mthabisi Ncube', achievement: 'Gold Medalist – Provincial Chess Championship (2025)' },
            { name: 'Hillary Mpofu', achievement: 'First Place – POTRAZ Letter Writing Competition MAT-SOUTH (2025)' },
            { name: 'Nontobeko Khumalo', achievement: 'First Place – POTRAZ Letter Writing Competition MAT-SOUTH (2024)' },
            { name: 'Bongiwe Sibanda', achievement: 'First Place – Provincial Darts Competition (2024)' },
          ].map((item, index) => (
            <li key={index} className="flex items-center">
              <span className="w-3 h-3 bg-yellow-400 rounded-full mr-3" />
              <span className="font-semibold text-gray-800">{item.name}:</span>
              <span className="ml-2 text-gray-600">{item.achievement}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section>
      <h2 className="text-3xl font-semibold mb-6 text-center text-indigo-700">Student Council</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { role: 'Head-Boy', name: 'Makhosi Ngwenya', grade: 'Form 4', description: 'Makhosi leads the student council with a vision to enhance student engagement and academic success.' },
          { role: 'Head-Girl', name: 'Nonsikelelo Phiri', grade: 'Form 4', description: 'Nonsikelelo coordinates various student initiatives and events.' },
          { role: 'Deputy Head-Boy', name: 'Sibusiso Tsitsane', grade: 'Form 4', description: "Sibusiso manages the student council's records and communication, ensuring smooth operations." },
          { role: 'Deputy Head-Girl', name: 'Wendy Tawachera', grade: 'Form 4', description: "Wendy manages the student council's records and communication, ensuring smooth operations." },
          { role: 'Student Councilor', name: 'Shekinah Dliwayo', grade: 'Form 3', description: "Shekinah manages the student council's records and communication, ensuring smooth operations." },
        ].map((member, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <h3 className="text-xl font-semibold text-indigo-700 mb-2">{member.role}</h3>
            <p className="text-lg text-gray-800 mb-1">{member.name}</p>
            <p className="text-md text-gray-600 mb-4">{member.grade}</p>
            <p className="text-gray-600">{member.description}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
)

export default Students
