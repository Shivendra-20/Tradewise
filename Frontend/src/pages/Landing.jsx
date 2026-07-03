import React from 'react'
import Navbar from '../components/Layout/Navbar.jsx'
import Hero from '../components/Landing/Hero.jsx'

import Features from '../components/Landing/Feature.jsx'
import HowItWorks from '../components/Landing/Howitworks.jsx'
import CTA from '../components/Landing/CTA.jsx'
import Footer from '../components/Layout/Footer.jsx'

function Landing() {
  return (
    <div>
      <Navbar/>
      <Hero/>
      <Features/>
      <HowItWorks/>
      <CTA/>
      <Footer/>
    </div>
  )
}

export default Landing