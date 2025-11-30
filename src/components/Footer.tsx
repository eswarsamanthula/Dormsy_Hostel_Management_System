import { Building, Github, Twitter, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Footer = () => {
  const { toast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Integrate with email service (e.g., Mailchimp, SendGrid)
      // For now, just show success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Successfully Subscribed!',
        description: 'Thank you for subscribing to our newsletter'
      });
      setNewsletterEmail('');
    } catch (error) {
      toast({
        title: 'Subscription Failed',
        description: 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Security", href: "#security" },
        { label: "Integrations", href: "#integrations" }
      ]
    },
    {
      title: "Company", 
      links: [
        { label: "About Us", href: "#about" },
        { label: "Careers", href: "#careers" },
        { label: "Blog", href: "#blog" },
        { label: "Contact", href: "#contact" }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#docs" },
        { label: "Help Center", href: "#help" },
        { label: "Community", href: "#community" },
        { label: "Status", href: "#status" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#privacy" },
        { label: "Terms of Service", href: "#terms" },
        { label: "Cookie Policy", href: "#cookies" },
        { label: "GDPR", href: "#gdpr" }
      ]
    }
  ];

  return (
    <footer id="contact" className="bg-gradient-to-b from-background to-accent/20 border-t border-border/50">
      <div className="container mx-auto px-4 py-16">
        {/* Main footer content */}
        <div className="grid lg:grid-cols-5 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                <Building className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Dormsy
              </span>
            </div>
            
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Modern hostel management made simple. Automate operations and improve student experience.
            </p>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10" aria-label="Visit our GitHub">
                <Github className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10" aria-label="Follow us on Twitter">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10" aria-label="Connect on LinkedIn">
                <Linkedin className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10" aria-label="Email us">
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Footer links */}
          {footerSections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h4 className="font-semibold text-foreground">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 rounded-2xl p-8 mb-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold">Stay Updated</h3>
            <p className="text-muted-foreground">
              Get updates on new features and best practices.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
                <input 
                  type="email" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  required
                  className="flex-1 px-4 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all disabled:opacity-50"
                  aria-label="Email address for newsletter"
                />
                <Button type="submit" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/50 gap-4">
          <div className="text-sm text-muted-foreground">
            © 2025 Dormsy. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;