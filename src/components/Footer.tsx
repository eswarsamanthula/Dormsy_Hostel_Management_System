import { Building, Github, ExternalLink, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const repoUrl = "https://github.com/eswarsamanthula/Dormsy_Hostel_Management_System.git";

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
        <div className="grid lg:grid-cols-5 gap-12 mb-12">
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
              <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Github className="h-4 w-4" />
                  <span>View on GitHub</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Button>
              </a>
            </div>
          </div>

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

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/50 gap-4">
          <div className="text-sm text-muted-foreground">
&copy; {new Date().getFullYear()} Dormsy. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Code2 className="h-4 w-4" />
            <span>
              Built by{" "}
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Eswar &amp; Team
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;