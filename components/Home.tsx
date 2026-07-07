import React from 'react';
import Navbar from './Layout/Navbar';
import Hero from './HeroMothersDay';
import About from './About';
import Treatments from './Treatments';
import BeforeAfter from './BeforeAfter';
import InstagramFeed from './InstagramFeed';
import Contact from './Contact';
import Footer from './Layout/Footer';

import FloatingWhatsApp from './FloatingWhatsApp';
import LegalModal from './LegalModal';
import Products from './Products';

const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-base selection:bg-gold selection:text-white">

            <Navbar />

            <main>
                <Hero />
                <About />
                <Treatments />
                <BeforeAfter />
                {/* Pass preview prop to show limited items and 'View All' button */}
                <Products preview={true} />
                <InstagramFeed />
                <Contact />
            </main>

            <Footer />
            <FloatingWhatsApp />
            <LegalModal />
        </div>
    );
};

export default Home;
