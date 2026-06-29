import React from "react";
import Section from "../ui/Section";
import styles from "./ContactUs.module.css";
import { HiOutlineMail, HiOutlinePhone } from "react-icons/hi";
import { IoLocationOutline } from "react-icons/io5";

export default function ContactUs() {
  const contactDetails = [
    {
      icon: <IoLocationOutline />,
      title: "Visit Us",
      content: "Alkapuri, Vadodara, Gujarat 390007",
      subContent: "Monday - Friday, 10am - 7pm",
    },
    {
      icon: <HiOutlineMail />,
      title: "Email Us",
      links: [
        { label: "business@onewebmart.com", href: "mailto:business@onewebmart.com" },
        { label: "onewebmartsolution@gmail.com", href: "mailto:onewebmartsolution@gmail.com" },
      ],
    },
    {
      icon: <HiOutlinePhone />,
      title: "Call Us",
      links: [
        { label: "+91-9033806717", href: "tel:+919033806717" },
        { label: "+91-9408307302", href: "tel:+919408307302" },
      ],
    },
  ];

  return (
    <Section title="Get In Touch" className={styles.contactSection}>
      <div className="container">
        <div className={styles.card}>
          <p className={styles.description}>
            Have a question or looking to start a project? Reach out to our team. 
            We usually respond within 24 hours.
          </p>

          <div className={styles.contactGrid}>
            {contactDetails.map((item, index) => (
              <div key={index} className={styles.contactItem}>
                <div className={styles.iconBox}>{item.icon}</div>
                <div className={styles.infoContent}>
                  <h6>{item.title}</h6>
                  {item.content && <p>{item.content}</p>}
                  {item.subContent && <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{item.subContent}</p>}
                  {item.links && item.links.map((link, lIdx) => (
                    <a key={lIdx} href={link.href} className={styles.link}>
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}