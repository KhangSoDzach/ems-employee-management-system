import React from "react";
import { Link } from "react-router-dom";
const AddingPage: React.FC = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="max-w-[480px] mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center px-4 py-3 justify-between">
            <Link
  to="/dashboard"
  className="flex size-10 items-center justify-center rounded-full
             hover:bg-gray-100 dark:hover:bg-gray-800"
>
  <span className="material-symbols-outlined">
 Back 
  </span>
</Link>

            <h2 className="text-lg font-bold flex-1 text-center pr-10 text-gray-900 dark:text-white">
              Create New Account
            </h2>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Employee Profile
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fill in the administrative details for the new hire.
              </p>
            </div>

            <form className="space-y-4">
              {/* Employee ID */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Employee ID
                </label>
                <div className="relative">
                  <input
                    readOnly
                    value="EMP-2023-0842"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                   
                  </span>
                </div>
                <p className="text-xs italic text-gray-400">
                  This ID is automatically generated.
                </p>
              </div>

              <Input label="Full Name" placeholder="e.g. Jonathan Doe" />
              <Input label="ID / Passport Number" />
              <Input
                label="Company Email"
                type="email"
                placeholder="name@company.com"
              />

              {/* Phone */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <select className="w-24 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-3 text-sm">
                    <option>+60</option>
                    <option>+65</option>
                    <option>+1</option>
                    <option>+44</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="12-345 6789"
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-4 py-3 text-sm"
                  />
                </div>
              </div>

              {/* DOB */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-4 py-3 text-sm"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* Profile photo */}
          <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-4">
            <div className="size-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-gray-400">
              
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Profile Photo
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                JPG or PNG, max 5MB
              </p>
            </div>
            <button className="text-xs font-bold px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700">
              Upload
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col gap-3">
            <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-md">
              Create Account
            </button>
            <button className="w-full border py-3.5 rounded-md text-gray-700 dark:text-gray-300">
              Cancel
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AddingPage;

type InputProps = {
  label: string;
  type?: string;
  placeholder?: string;
};

const Input: React.FC<InputProps> = ({
  label,
  type = "text",
  placeholder,
}) => (
  <div>
    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-4 py-3 text-sm"
    />
  </div>
);
