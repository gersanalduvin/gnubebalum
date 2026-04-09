// Mock database for academy app

export const db = {
  courses: [
    {
      id: 1,
      title: 'Curso de ejemplo',
      description: 'Descripción del curso',
      instructor: 'Instructor de ejemplo',
      duration: '8 horas',
      level: 'Principiante',
      price: 99.99,
      image: '/images/courses/example.jpg',
      enrolled: 100,
      rating: 4.5
    }
  ],
  categories: [
    {
      id: 1,
      name: 'Desarrollo Web',
      count: 10
    }
  ],
  instructors: [
    {
      id: 1,
      name: 'Instructor de ejemplo',
      bio: 'Biografía del instructor',
      avatar: '/images/avatars/instructor.jpg'
    }
  ],
  enrollments: []
}

export default db