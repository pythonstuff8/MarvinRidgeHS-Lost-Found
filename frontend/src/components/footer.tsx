import { Facebook, Instagram, Twitter, Youtube, Globe } from "lucide-react";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-gray-100 text-gray-700 font-sans border-t border-gray-200">
            {/* Top Section: Main Info & Links */}
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Column 1: School Info */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                            Marvin Ridge High School
                        </h2>
                        <div className="text-sm space-y-1">
                            <p>2825 Crane Road</p>
                            <p>Waxhaw, NC 28173</p>
                            <p className="font-bold underline cursor-pointer hover:text-fbla-blue">704-290-1520</p>
                        </div>
                    </div>

                    {/* Column 2: Links & Resources */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Links & Resources</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                            <Link href="https://mrhs.ucpsnc.org/about-us/calendar" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-fbla-blue">Calendar</Link>
                            <Link href="https://www.ucps.k12.nc.us/domain/189" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-fbla-blue">Email</Link>
                            <Link href="https://www.ucpsnc.org/careers" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-fbla-blue">Careers</Link>
                            <Link href="https://www.ucpsnc.org/about/legal-compliance" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-fbla-blue">Legal Compliance</Link>
                            <Link href="https://ucpsapps.ucps.k12.nc.us/staffdirectory/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-fbla-blue">Directory</Link>
                            <Link href="https://www.ucps.k12.nc.us/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-fbla-blue">UCPS Homepage</Link>
                        </div>
                    </div>

                    {/* Column 3: Stay Connected */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Stay Connected</h3>
                        <div className="flex space-x-3">
                            <a href="https://www.facebook.com/MarvinRidgeHSNC/" target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-shadow text-gray-600 hover:text-fbla-blue">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://www.instagram.com/marvinridgehsnc" target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-shadow text-gray-600 hover:text-pink-600">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://x.com/marvinridgehsnc" target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-shadow text-gray-600 hover:text-black">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://www.youtube.com/user/MarvinRidgeHSNC" target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-shadow text-gray-600 hover:text-red-600">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section: UCPS Blurb */}
            <div className="bg-gray-200 py-6 px-4">
                <div className="container mx-auto text-center max-w-4xl">
                    <p className="text-xs md:text-sm italic text-gray-600">
                        Union County Public Schools is the sixth-largest public school system in North Carolina. We serve approximately 41,000 students at 53 schools and have approximately 5,000 staff members.
                    </p>
                </div>
            </div>




        </footer>
    );
}
