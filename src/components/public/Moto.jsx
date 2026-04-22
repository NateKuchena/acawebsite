import React from 'react'
import { Lightbulb, Group, Gavel, Diversity3, Handshake, EmojiEvents } from '@mui/icons-material'

const mottoItems = [
  { title: 'Integrity', description: 'We strive to cultivate a spirit of innovation among our students, encouraging them to think outside the box, explore new ideas, and pioneer groundbreaking solutions to real-world challenges.', icon: <Lightbulb /> },
  { title: 'Teamwork', description: 'We recognize the importance of teamwork in achieving collective success. Through collaborative projects and extracurricular activities, we foster a collaborative mindset among our students.', icon: <Group /> },
  { title: 'Discipline', description: 'We instill discipline as the foundation for personal and academic growth. By encouraging responsibility, time management, and self-control, we help our students build habits that lead to long-term success.', icon: <Gavel /> },
  { title: 'Empathy', description: 'We cultivate empathy by teaching students to respect and understand the perspectives of others. Through service learning and inclusive activities, we promote kindness and compassion in all interactions.', icon: <Diversity3 /> },
  { title: 'Client Focus', description: 'We emphasize client focus by preparing our learners to meet the needs of others with professionalism and care. Through practical experiences and problem-solving tasks, students learn to deliver value and exceed expectations.', icon: <Handshake /> },
  { title: 'Excellence', description: 'We pursue excellence by inspiring our students to give their best in academics, sports, and personal growth. We encourage a culture of continuous improvement and high standards in everything we do.', icon: <EmojiEvents /> },
]

const Moto = () => (
  <div className="bg-gradient-to-b from-blue-50 to-white py-20">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6 text-blue-900">Our Vision</h1>
        <p className="text-2xl font-semibold text-blue-700">
          To glorify God through the training and the nurturing of students in their spiritual, academic, physical, emotional, and social development. This is achieved through a Christ-centered education based on biblical truth, which leads to the formation of the character of God within. God's character impacts wisdom, knowledge, and love, helping our school community to develop a world-view that will impact the world for Christ.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
        {mottoItems.map((item, index) => (
          <div key={index} className="bg-white rounded-xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                {React.cloneElement(item.icon, { className: 'text-blue-600 text-3xl' })}
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-blue-800 text-center">{item.title}</h3>
            <p className="text-gray-600 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-blue-800 text-center">Our Mission</h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          At <span className="font-semibold text-blue-700">Amazon Christian Academy</span>, our mission is to prepare students for life both globally and eternally.
        </p>
      </div>
    </div>
  </div>
)

export default Moto
