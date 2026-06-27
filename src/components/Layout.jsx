import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'

function Layout({ children }) {
    return (
        <div className="app-layout">

            <Header />

            <div className="content-wrapper">
                <Sidebar />

                {children}
            </div>

            <Footer />

        </div>
    )
}

export default Layout