
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminRoute } from './components/AdminRoute'
import { Login } from './pages/Login'
import { Calculators } from './pages/Calculators'
import { Studio } from './pages/Studio'
import { StudioLectures } from './pages/StudioLectures'
import { StudioGASolutions } from './pages/StudioGASolutions'
import { StudioResourceManager } from './pages/StudioResourceManager'
import { StudioStudents } from './pages/StudioStudents'
import { StudioAnalytics } from './pages/StudioAnalytics'
import { StudioSubjects } from './pages/StudioSubjects'
import { PublicResources } from './pages/PublicResources'
import { About, GASolutions, Home, Lectures } from './pages/Pages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="lectures" element={<Lectures />} />
          <Route path="ga-solutions" element={<GASolutions />} />
          <Route path="calculators" element={<Calculators />} />
          <Route path="about" element={<About />} />
          <Route path="login" element={<Login />} />

          <Route path="notes" element={<PublicResources type="note" />} />
          <Route path="past-papers" element={<PublicResources type="past_paper" />} />
          <Route path="courses" element={<PublicResources type="course" />} />

          <Route path="studio" element={<AdminRoute><Studio /></AdminRoute>} />
          <Route path="studio/lectures" element={<AdminRoute><StudioLectures /></AdminRoute>} />
          <Route path="studio/ga-solutions" element={<AdminRoute><StudioGASolutions /></AdminRoute>} />
          <Route path="studio/subjects" element={<AdminRoute><StudioSubjects /></AdminRoute>} />
          <Route path="studio/notes" element={<AdminRoute><StudioResourceManager type="note" /></AdminRoute>} />
          <Route path="studio/past-papers" element={<AdminRoute><StudioResourceManager type="past_paper" /></AdminRoute>} />
          <Route path="studio/courses" element={<AdminRoute><StudioResourceManager type="course" /></AdminRoute>} />
          <Route path="studio/students" element={<AdminRoute><StudioStudents /></AdminRoute>} />
          <Route path="studio/analytics" element={<AdminRoute><StudioAnalytics /></AdminRoute>} />

          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
