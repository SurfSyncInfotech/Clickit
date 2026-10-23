import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles.css'
import './panels.css'
import './panels-soft.css'
import './dash.css'
import './mobile.css'
import { SiteLayout } from './components/Site.jsx'
import Home from './pages/Home.jsx'
import { ServicePage, CityPage } from './pages/ServicePage.jsx'
import { Faq, Legal, Blog, Post } from './pages/Pages.jsx'
import About from './pages/About.jsx'
import UserApp from './pages/UserApp.jsx'
import StaffApp from './pages/StaffApp.jsx'
import AdminApp from './pages/AdminApp.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/house-help" element={<ServicePage id="house-help" />} />
        <Route path="/house-help/:city" element={<CityPage />} />
        <Route path="/home-cook" element={<ServicePage id="home-cook" />} />
        <Route path="/bathroom-cleaning" element={<ServicePage id="bathroom-cleaning" />} />
        <Route path="/dishwashing" element={<ServicePage id="dishwashing" />} />
        <Route path="/fan-cleaning" element={<ServicePage id="fan-cleaning" />} />
        <Route path="/kitchen-cleaning" element={<ServicePage id="kitchen-cleaning" />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<Post />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/legal/:doc" element={<Legal />} />
      </Route>
      <Route path="/user/*" element={<UserApp />} />
      <Route path="/staff/*" element={<StaffApp />} />
      <Route path="/superadmin/*" element={<AdminApp mode="super" />} />
      <Route path="/team/*" element={<AdminApp mode="team" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </BrowserRouter>
)
