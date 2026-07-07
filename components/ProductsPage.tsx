import React from 'react';
import Navbar from './Layout/Navbar';
import Footer from './Layout/Footer';

import Products from './Products';
import LegalModal from './LegalModal';

const ProductsPage: React.FC = () => {
    // Scroll to top on mount
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-base selection:bg-gold selection:text-white flex flex-col">

            <Navbar />

            <main className="pt-20 flex-grow"> {/* Add padding for fixed header */}
                <Products preview={false} />
            </main>

            <Footer />
            <LegalModal />
        </div>
    );
};

export default ProductsPage;
