import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Support = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [supportTab, setSupportTab] = useState('faq');
  const [openFaq, setOpenFaq] = useState(0);

  const [contactForm, setContactForm] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState(null); // { type: 'success' | 'error', message: '' }

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      setFormStatus({ type: 'error', message: 'Please enter both subject and message.' });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setFormStatus(null);
      const res = await axiosInstance.post('/merchant/support-tickets', contactForm);
      if (res.data?.success) {
        setFormStatus({ type: 'success', message: 'Your message has been sent successfully! Our team will respond within 24 hours.' });
        setContactForm({ subject: '', message: '' });
      }
    } catch (err) {
      console.error(err);
      setFormStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send message. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['faq', 'guides', 'contact'].includes(tab)) {
      setSupportTab(tab);
    }
  }, [location.search]);

  const faqs = [
    {
      question: "How do I mint new tokens?",
      answer: "Go to the 'New Mint Token' section in the main menu. Select the denomination, enter the quantity, and confirm the minting. The tokens will be instantly created and added to your inventory."
    },
    {
      question: "How do I verify customer tokens?",
      answer: "You can verify customer tokens by scanning their QR code or entering the token ID in the 'Transactions' page. The system will automatically check if the token is valid and unspent."
    },
    {
      question: "What are the available token denominations?",
      answer: "Currently, tokens can be minted in standard denominations such as 10, 20, 50, 100, and 500 depending on your platform configuration."
    },
    {
      question: "How does daily settlement work?",
      answer: "All your verified transactions are batched at the end of the day. The total amount, minus any processing fees, will be settled directly to your registered bank account within 24-48 hours."
    },
    {
      question: "What are the processing fees?",
      answer: "Processing fees vary based on your merchant agreement. Please refer to the 'Settings' > 'Profile' or contact your account manager for detailed fee structures."
    },
    {
      question: "How do I update my bank details?",
      answer: "To update your bank details, you must contact our support team directly for security reasons. Provide a canceled check or bank statement as verification."
    },
    {
      question: "Can I set transaction limits for staff?",
      answer: "Yes, in the upcoming 'Staff Management' update, you will be able to create sub-accounts with specific daily transaction or minting limits."
    },
    {
      question: "How do I download transaction reports?",
      answer: "Navigate to the 'Transactions' tab. Click on the 'Export' button in the top right corner to download your transaction history as a CSV or PDF file."
    }
  ];

  const guides = [
    { title: "Getting Started Guide", desc: "Set up your merchant account and first transaction" },
    { title: "Token Minting Guide", desc: "Complete guide to minting and managing tokens" },
    { title: "Settlement Process", desc: "Understanding daily settlement and payouts" },
    { title: "Best Practices", desc: "Tips for optimal merchant account management" }
  ];

  return (
    <div className="max-w-[1200px] mx-auto p-8 font-sans space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#59111c] rounded-xl p-6 relative overflow-hidden shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Welcome Back, {user?.username || user?.businessName || user?.name || 'Merchant'} 👋
        </h2>
        <p className="text-red-100 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      <div className="animate-in fade-in duration-300">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Help & Support</h2>
          <p className="text-sm text-slate-500 mt-1">Find answers to common questions and get support</p>
        </div>

        {/* Support Sub Navigation */}
        <div className="bg-slate-200/60 p-1.5 rounded-xl flex items-center mb-6">
          {['faq', 'guides', 'contact'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSupportTab(tab)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 capitalize ${
                supportTab === tab 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* FAQ Tab Content */}
        {supportTab === 'faq' && (
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={faq.question} className="border border-slate-300 rounded-lg bg-white overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors focus:outline-none"
                >
                  <span className="font-bold text-slate-800 text-sm text-left">{faq.question}</span>
                  {openFaq === idx ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-sm text-slate-600 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Guides Tab Content */}
        {supportTab === 'guides' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guides.map((guide, idx) => (
              <div key={guide.title} className="bg-white border border-slate-300 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{guide.title}</h3>
                  <p className="text-sm font-medium text-slate-500 mt-2">{guide.desc}</p>
                </div>
                <button className="mt-6 w-full bg-[#59111c] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-colors">
                  Read Guide
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Contact Tab Content */}
        {supportTab === 'contact' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-300 rounded-xl p-6 flex flex-col items-center text-center">
                <h4 className="font-bold text-slate-800">Email Support</h4>
                <p className="text-xs text-slate-500 mt-1">Contact</p>
                <p className="text-sm font-bold text-slate-800 mt-2">support@dfs-platform.com</p>
                <p className="text-xs text-slate-500 mt-1">Response within 24 hours</p>
                <button className="w-full mt-4 bg-[#59111c] text-white py-2 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-colors">
                  Contact Us
                </button>
              </div>
              <div className="bg-white border border-slate-300 rounded-xl p-6 flex flex-col items-center text-center">
                <h4 className="font-bold text-slate-800">Phone Support</h4>
                <p className="text-xs text-slate-500 mt-1">Contact</p>
                <p className="text-sm font-bold text-slate-800 mt-2">+91 1800-XXX-XXXX</p>
                <p className="text-xs text-slate-500 mt-1">Available 9 AM - 6 PM IST</p>
                <button className="w-full mt-4 bg-[#59111c] text-white py-2 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-colors">
                  Contact Us
                </button>
              </div>
              <div className="bg-white border border-slate-300 rounded-xl p-6 flex flex-col items-center text-center">
                <h4 className="font-bold text-slate-800">Live Chat</h4>
                <p className="text-xs text-slate-500 mt-1">Contact</p>
                <p className="text-sm font-bold text-slate-800 mt-2">Available on the platform</p>
                <p className="text-xs text-slate-500 mt-1">Real-time assistance</p>
                <button className="w-full mt-4 bg-[#59111c] text-white py-2 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-colors">
                  Contact Us
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800">Send us a Message</h3>
                <p className="text-sm text-slate-500 mt-1">Have a question or issue? Submit a ticket</p>
              </div>
              
              <form className="space-y-5" onSubmit={handleContactSubmit}>
                {formStatus && (
                  <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
                    formStatus.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {formStatus.message}
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-bold text-slate-700">Subject</label>
                  <input 
                    id="subject"
                    type="text" 
                    placeholder="How can we help?"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#59111c] focus:ring-1 focus:ring-[#59111c] focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-bold text-slate-700">Message</label>
                  <textarea 
                    id="message"
                    rows={4}
                    placeholder="Describe your issue......"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#59111c] focus:ring-1 focus:ring-[#59111c] resize-none focus:bg-white transition-colors"
                  ></textarea>
                </div>
                <div className="pt-2 flex justify-start">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 bg-[#59111c] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
