import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import HeroSection from '../components/hero/HeroSection';

// ==========================================
// SECTION: ESP32 + FIREBASE SHOWCASE
// ==========================================

const syncSteps = [
  { id: 1, title: 'Prescription Event', desc: 'Physician approves order, pushing JSON schema to cloud.', sender: 'Console', receiver: 'Firebase' },
  { id: 2, title: 'RTDB Listener Trigger', desc: 'Firebase listener fires, notifying the ESP32 edge client in 1.2s.', sender: 'Firebase', receiver: 'ESP32' },
  { id: 3, title: 'Physical Actuation', desc: 'ESP32 parses payload, triggers SG90 servo and validates dispense.', sender: 'ESP32', receiver: 'Dispenser' }
];

const SyncShowcase: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative bg-[#ffffff] py-32 overflow-hidden border-t border-b border-[#e2e5ea]" id="clinical-data">
      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-white border border-[#e2e5ea] rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#185FA5]" />
            <span className="text-xs font-mono text-[#6b7280] tracking-wider uppercase">Edge Cloud Showcase</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1a1d23] mb-4">
            ESP32 + Firebase Real-time Synchronization
          </h2>
          <p className="text-[#6b7280] text-sm lg:text-base max-w-2xl mx-auto leading-relaxed">
            How NexDose coordinates secure physical pill delivery from the cloud console to the patient bedside in under 3 seconds.
          </p>
        </div>

        {/* Visual Sync Flowchart Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-20">
          {syncSteps.map((step, idx) => (
            <motion.div 
              key={step.id}
              className="bg-[#f8f9fb] border border-[#e2e5ea] rounded-2xl p-6 relative flex flex-col justify-between"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-[#185FA5] bg-[#E6F1FB] font-bold px-2.5 py-1 rounded">
                    STAGE 0{step.id}
                  </span>
                  <div className="text-[9px] font-mono text-[#6b7280] uppercase tracking-wider">
                    {step.sender} ➔ {step.receiver}
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#1a1d23] mb-2">{step.title}</h3>
                <p className="text-xs text-[#6b7280] leading-relaxed">{step.desc}</p>
              </div>

              {/* Decorative data packet anim */}
              <div className="mt-8 h-1 w-full bg-[#e2e5ea] rounded-full overflow-hidden relative">
                <motion.div 
                  className="h-full bg-[#185FA5] w-8 rounded-full"
                  animate={{
                    x: ['-100%', '300%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: idx * 0.4
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Technical Architecture highlights */}
        <div className="bg-[#f8f9fb] border border-[#e2e5ea] rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold text-[#1a1d23] mb-4">ESP32 Firmware Architecture</h3>
            <ul className="flex flex-col gap-3 text-xs text-[#6b7280] leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-[#185FA5] mt-0.5">✔</span>
                <span><strong>Firebase JSON Stream Listener:</strong> Persistent WebSocket listeners avoid HTTP polling overhead, firing callbacks in sub-second intervals.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#185FA5] mt-0.5">✔</span>
                <span><strong>Ultrasonic Hand-Check:</strong> Ultrasonic sensors double-check compartment drops, validating pill delivery before closing the tray.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#185FA5] mt-0.5">✔</span>
                <span><strong>Fail-Safe Offline Queue:</strong> In the event of a power/network outage, internal flash registers protect logs and dosage states.</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1a1d23] mb-4">Cloud Synchronization & Security</h3>
            <ul className="flex flex-col gap-3 text-xs text-[#6b7280] leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-[#185FA5] mt-0.5">✔</span>
                <span><strong>Cryptographic Handshake:</strong> Secure Firebase connection using custom RTDB Security Rules protects edge dispenser slots from unauthorized triggers.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#185FA5] mt-0.5">✔</span>
                <span><strong>Audit Log Invariant:</strong> Immutable logs generated at the edge are synced to Firestore, forming a HIPAA-compliant drug ledger.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#185FA5] mt-0.5">✔</span>
                <span><strong>Low Stock Alerts:</strong> Cloud functions track dispenser logs, immediately issuing low stock reports to inventory personnel.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// SECTION: FEATURES (What it does)
// ==========================================

const features = [
  {
    id: 'dispensing',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Servo-Motor Dispensing',
    description: '4-6 isolated compartments, each governed by an SG90 servo motor. Opens only the target slot, dispensing medications in sub-second actuation.',
    tag: 'hardware'
  },
  {
    id: 'realtime',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Firebase Real-Time Sync',
    description: 'Cloud prescription triggers synchronise with the ESP32 edge listeners in under 1.2 seconds, ensuring zero latency delivery.',
    tag: 'cloud'
  },
  {
    id: 'inventory',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Automated Restocking Alerts',
    description: 'Continuous compartment monitoring fires instant warnings when drug stock levels fall beneath critical levels.',
    tag: 'analytics'
  },
  {
    id: 'telemetry',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Edge Device Telemetry',
    description: 'ESP32 edge nodes report WiFi RSSI, battery voltage levels, CPU temperatures, and online state to the cloud dashboard.',
    tag: 'iot'
  },
  {
    id: 'audit',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'HIPAA-Compliant Ledger',
    description: 'Immutable, timestamped audit records with specific physician logins, patient identifiers, and compartment counts.',
    tag: 'compliance'
  },
  {
    id: 'patients',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Physician Prescription Control',
    description: 'Complete patient medication mapping: associate drug schedules directly with edge cabinet dispensing slots.',
    tag: 'clinical'
  }
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any, delay: i * 0.07 }
  })
};

const FeaturesSection: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative bg-[#f8f9fb] py-32 overflow-hidden" id="what-it-does">
      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as any }}
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1a1d23] mb-4">What it does</h2>
          <p className="text-[#6b7280] text-sm lg:text-base max-w-2xl mx-auto leading-relaxed">
            Six integrated systems — from servo motor hardware to cloud sync — working together so the right medicine reaches the right patient, every time.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <motion.div 
              key={feat.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="group relative p-6 rounded-2xl border border-[#e2e5ea] bg-white shadow-sm hover:border-[#185FA5]/30 transition-all duration-500"
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-[#185FA5] bg-[#E6F1FB] border border-[#185FA5]/10 group-hover:border-[#185FA5]/30 transition-all duration-300">
                {feat.icon}
              </div>
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider mb-3 text-[#185FA5] bg-[#E6F1FB]">
                {feat.tag}
              </div>
              <h3 className="text-base font-semibold text-[#1a1d23] mb-2">{feat.title}</h3>
              <p className="text-xs text-[#6b7280] leading-relaxed">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// SECTION: WORKFLOW (Prescription to Pill)
// ==========================================

const workflowSteps = [
  { id: 'doctor', step: 1, actor: 'Doctor', description: 'Approves prescription. Dashboard broadcasts structured JSON data containing target slot and dosage.', icon: 'DR' },
  { id: 'firebase', step: 2, actor: 'Firebase', description: 'Order document written to /dispensers/{id}/queue. RTDB listener fires within 1.2s, reads target compartment address.', icon: 'FB' },
  { id: 'esp32', step: 3, actor: 'ESP32', description: 'Microcontroller receives payload, verifies status, and acts as secure edge coordinator. SG90 servo rotates to open the correct compartment.', icon: 'E32' },
  { id: 'dispenser', step: 4, actor: 'Dispenser', description: 'Servo motor opens window compartment. Photoresistors confirm pill drop, and board updates inventory indicators.', icon: 'RX' },
  { id: 'patient', step: 5, actor: 'Patient', description: 'Medication safely delivered. Sync complete, adding cryptographically signed log entries to ledger.', icon: 'PT' }
];

const WorkflowSection: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative bg-[#ffffff] py-32 overflow-hidden" id="workflow">
      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 bg-white border border-[#e2e5ea] rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#185FA5]" />
            <span className="text-xs font-mono text-[#6b7280] tracking-wider uppercase">Clinical Workflow</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1a1d23] mb-4">
            From Prescription to Bedside Dispense
          </h2>
          <p className="text-[#6b7280] text-sm lg:text-base max-w-xl mx-auto">
            From prescription to pill — in under 3 seconds
          </p>
        </motion.div>

        {/* Workflow steps */}
        <div className="flex flex-col items-center gap-0 max-w-2xl mx-auto">
          {workflowSteps.map((step, i) => (
            <motion.div 
              key={step.id} 
              className="w-full"
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as any }}
            >
              <div 
                className="relative flex items-start gap-4 p-5 rounded-2xl border border-[#e2e5ea] bg-white hover:border-[#185FA5]/30 shadow-sm transition-all duration-300 group"
                style={{ marginLeft: `${i * 12}px`, marginRight: `${(4 - i) * 12 > 0 ? (4 - i) * 12 : 0}px` }}
              >
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-[#185FA5]/25 bg-[#E6F1FB] text-[#185FA5] group-hover:scale-110 transition-transform duration-300 font-semibold">
                    {step.icon}
                  </div>
                  <div className="text-[8px] font-mono text-[#6b7280] mt-1 tracking-wider uppercase">
                    Step {step.step}
                  </div>
                </div>

                <div className="flex-1 pt-1">
                  <h3 className="text-sm font-semibold text-[#1a1d23] mb-1">{step.actor}</h3>
                  <p className="text-xs text-[#6b7280] leading-relaxed">{step.description}</p>
                </div>
              </div>

              {i < workflowSteps.length - 1 && (
                <div className="flex justify-center my-0">
                  <div className="w-px h-6 bg-[#e2e5ea]" style={{ marginLeft: `${i * 12 + 36}px` }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// SECTION: SYSTEM ARCHITECTURE
// ==========================================

const layers = [
  { label: 'Presentation UI Layer', tech: 'React + TypeScript + Tailwind CSS + Framer Motion', width: '100%' },
  { label: 'State & Authentication Sync', tech: 'Firebase Authentication + Realtime Database (RTDB) + Firestore', width: '88%' },
  { label: 'Cloud Stream Layer', tech: 'WebSocket Protocols + MQTT Broker + TLS 1.3 Encryption', width: '76%' },
  { label: 'Edge Hardware Controller', tech: 'ESP32 Firmware + FreeRTOS Tasking + Arduino Framework', width: '64%' },
  { label: 'Physical Actuation Layer', tech: '4× Servo-Windows, HC-SR04 ultrasonic check, status LED array', width: '52%' }
];

const ArchitectureSection: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative bg-[#f8f9fb] py-32" id="system-architecture">
      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 bg-white border border-[#e2e5ea] rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B6D11]" />
            <span className="text-xs font-mono text-[#6b7280] tracking-wider uppercase">System Architecture</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1a1d23] mb-4">
            How it's built — 5 layers from servo to cloud
          </h2>
          <p className="text-[#6b7280] text-sm lg:text-base max-w-2xl mx-auto leading-relaxed">
            Full-stack IoT solution integrating hardware edge nodes and cloud database listeners.
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-2.5 max-w-3xl mx-auto">
          {layers.map((layer, i) => (
            <motion.div 
              key={layer.label}
              className="relative p-4 rounded-xl border border-[#e2e5ea] bg-white hover:border-[#185FA5]/30 shadow-sm transition-all duration-300 group"
              style={{ width: layer.width }}
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={inView ? { opacity: 1, scaleX: 1 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as any }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono text-[#185FA5] tracking-wider mb-0.5 uppercase">
                    Layer {i + 1}
                  </div>
                  <div className="text-xs font-semibold text-[#1a1d23]">{layer.label}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#6b7280] max-w-xs text-right leading-relaxed font-mono">
                    {layer.tech}
                  </div>
                </div>
              </div>
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[#185FA5]" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// SECTION: FOOTER
// ==========================================

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#f8f9fb] border-t border-[#e2e5ea] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7">
                <div className="absolute inset-0 bg-[#185FA5]/10 rounded-md blur-sm" />
                <div className="relative flex items-center justify-center w-7 h-7 bg-[#185FA5]/10 border border-[#185FA5]/30 rounded-md">
                  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                    <rect x="2" y="2" width="5" height="5" rx="1.5" fill="#185FA5" opacity="0.9" />
                    <rect x="9" y="2" width="5" height="5" rx="1.5" fill="#185FA5" opacity="0.6" />
                    <rect x="2" y="9" width="5" height="5" rx="1.5" fill="#185FA5" opacity="0.6" />
                    <rect x="9" y="9" width="5" height="5" rx="1.5" fill="#185FA5" opacity="0.4" />
                  </svg>
                </div>
              </div>
              <span className="text-sm font-semibold text-[#1a1d23] tracking-tight">NexDose</span>
            </div>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Open-source IoT medicine dispenser — ESP32 + Firebase + React. Built for hospitals, clinics, and pharmacies.
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#639922]" />
              <span className="text-[10px] font-mono text-[#6b7280] uppercase">All systems operational</span>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { title: 'Platform', links: ['Clinical Console', 'API Documentation', 'Hardware Schema', 'Security Policy'] },
              { title: 'System', links: ['System Architecture', 'Clinical Workflow', 'Device Monitor', 'Audit Logs'] },
              { title: 'Resources', links: ['Technical Specs', 'ESP32 Firmware', 'Firebase Rules', 'HIPAA Docs'] }
            ].map((col) => (
              <div key={col.title}>
                <div className="text-[10px] font-mono text-[#1a1d23] tracking-wider mb-4 font-bold uppercase">
                  {col.title}
                </div>
                <div className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <a key={link} href="#" className="text-xs text-[#6b7280] hover:text-[#185FA5] transition-colors duration-200">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#e2e5ea]">
          <p className="text-[10px] text-[#6b7280] font-mono">
            &copy; 2026 NexDose Clinical Health Solutions. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['API Documentation', 'Hardware Schema', 'Security Policy'].map((link) => (
              <a key={link} href="#" className="text-[10px] text-[#6b7280] hover:text-[#185FA5] transition-colors duration-200">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

// ==========================================
// MAIN LANDING PAGE
// ==========================================

const Landing: React.FC = () => {
  return (
    <main className="bg-white">
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <SyncShowcase />
      <ArchitectureSection />
      <Footer />
    </main>
  );
};

export default Landing;
