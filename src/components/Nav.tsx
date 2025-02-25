const Nav = () => {
    return <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
                <div className="flex items-center">
                    <span className="text-xl font-bold text-gray-900">Slates</span>
                </div>
                <div className="hidden md:flex items-center space-x-8">
                    <a href="#technology" className="text-gray-600 hover:text-blue-600">Technology</a>
                    <a href="#benefits" className="text-gray-600 hover:text-blue-600">Benefits</a>
                    <a href="#pricing" className="text-gray-600 hover:text-blue-600">Pricing</a>
                    <a href="#demo" className="text-gray-600 hover:text-blue-600">Live Demo</a>
                    <a
                        href="/auth"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Sign In
                    </a>
                </div>
            </div>
        </div>
    </nav>
}

export default Nav;