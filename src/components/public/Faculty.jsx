import { fars, eng, bes, bible, math, noma, lit, her, nde, pes, acc, bio, bursar, tg, principal, geo, sci } from '@/assets'

const aboutData = [
  { name: 'Mr N K Kuchena', description: 'Principal', image: principal, quote: 'Welcome to our school community! We are dedicated to fostering a nurturing environment that promotes academic and personal growth. Join us in making a positive impact.' },
  { name: 'Mrs P Ndlovu', description: 'Deputy Principal', image: lit, quote: 'Leadership is about guiding each learner to discover their potential. Together, we build a school where discipline, respect, and excellence shape every future.' },
  { name: 'Mrs N Mlangeni', description: 'School Administrator', image: noma, quote: 'Together, we can achieve greatness. Let\'s work hand-in-hand to shape the future and build a thriving school environment.' },
  { name: 'Mrs Z Nyoni', description: 'School Bursar', image: bursar, quote: 'Managing our school\'s resources responsibly ensures that every student has the tools they need to succeed. Together, we build a foundation of trust, transparency, and opportunity.' },
  { name: 'Mr S Maseko', description: 'Science Teacher', image: sci, quote: 'Science is the root of discovery and progress. Let\'s explore knowledge that powers innovation and secures our future.' },
  { name: 'Min T Dlamini', description: 'Bible Teacher', image: bible, quote: 'Through the study of the Bible, we learn values that guide our hearts and minds. Let us explore its teachings to inspire faith, character, and wisdom in everyday life.' },
  { name: 'Mr S Jamela', description: 'IsiNdebele Teacher', image: nde, quote: 'IsiNdebele liphila emoyeni wobuntu bethu. Masilondoloze ubuhle bayo njalo sabelane ngelukuluku kwayo ngokuqhosha.' },
  { name: 'Mrs K S Ncube', description: 'Heritage Studies Teacher', image: her, quote: 'Heritage connects us to our roots and guides our future. Let us celebrate who we are and where we come from.' },
  { name: 'Mr F Mhletshwa', description: 'Biology Teacher', image: bio, quote: 'Biology is the study of life in all its forms. Let\'s explore the wonders of nature and understand the living world around us.' },
  { name: 'Mrs E Khabi', description: 'English Teacher', image: eng, quote: 'English is the bridge to communication and expression. Let\'s master it together to share our voices with the world.' },
  { name: 'Mrs M M Munanga', description: 'PES Teacher', image: pes, quote: 'Through movement and teamwork, PES builds strong bodies and stronger characters. Let us grow in strength, skill, and spirit.' },
  { name: 'Miss N Moyo', description: 'Mathematics Teacher', image: math, quote: 'Mathematics is the language of the universe. Let\'s unlock its secrets together.' },
  { name: 'Mr D Chamisa', description: 'History Teacher', image: fars, quote: 'History is the memory of humanity. Let us learn from the past to shape a wiser tomorrow.' },
  { name: 'Mr B Khabi', description: 'Geography Teacher', image: geo, quote: 'Geography helps us understand the world we live in. Let\'s explore landscapes, cultures, and the forces that shape our planet.' },
  { name: 'Mrs S Jamela', description: 'Business Enterprise Skills Teacher', image: bes, quote: 'Enterprise sparks innovation and opportunity. Let\'s build skills to create, lead, and succeed in business.' },
  { name: 'Miss P Zikhali', description: 'Accounts Teacher', image: acc, quote: 'Accounting is the language of business. Let\'s master the numbers that drive decisions and growth.' },
  { name: 'Miss Y Rodgers', description: 'Technical Drawing Teacher', image: tg, quote: 'Technical Drawing turns imagination into precision. Let\'s design the structures that bring ideas to life.' },
  { name: 'Mr N J Sikeyi', description: 'Computer Science Teacher', image: 'https://media.istockphoto.com/id/685132245/photo/mature-businessman-smiling-over-white-background.webp?b=1&s=170667a&w=0&k=20&c=XKyPqI4mZGKQLoUXMqJKkJ3Ovm69rIWG-sq_UstDyY4=', quote: 'Computer Science is the engine of innovation. Let\'s code the future and solve tomorrow\'s problems today.' },
]

function Faculty() {
  const principalMember = aboutData.find(m => m.description === 'Principal')
  const vicePrincipal = aboutData.find(m => m.description === 'Deputy Principal')
  const otherFaculty = aboutData.filter(m => m.description !== 'Principal' && m.description !== 'Deputy Principal')

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-16 text-indigo-800">Our Faculty</h1>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {principalMember && (
          <div className="rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
            <div className="md:flex">
              <div className="md:flex-shrink-0">
                <img className="h-full w-full object-cover md:w-48" src={principalMember.image} alt={principalMember.name} />
              </div>
              <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-blue-600 font-semibold">{principalMember.description}</div>
                <h2 className="block mt-1 text-2xl leading-tight font-medium text-black">{principalMember.name}</h2>
                <p className="mt-2 text-gray-500">{principalMember.quote}</p>
              </div>
            </div>
          </div>
        )}
        {vicePrincipal && (
          <div className="rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
            <div className="md:flex">
              <div className="md:flex-shrink-0">
                <img className="h-full w-full object-cover md:w-48" src={vicePrincipal.image} alt={vicePrincipal.name} />
              </div>
              <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-green-600 font-semibold">{vicePrincipal.description}</div>
                <h2 className="block mt-1 text-2xl leading-tight font-medium text-black">{vicePrincipal.name}</h2>
                <p className="mt-2 text-gray-500">{vicePrincipal.quote}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {otherFaculty.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-8 text-center text-indigo-800">Our Dedicated Faculty</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherFaculty.map((data, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
                <img className="h-56 w-full object-cover object-top" src={data.image} alt={data.name} />
                <div className="p-6">
                  <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{data.description}</div>
                  <h3 className="mt-1 text-xl leading-tight font-medium text-black">{data.name}</h3>
                  <p className="mt-2 text-gray-500">{data.quote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Faculty
