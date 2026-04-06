import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  RiSparklingFill,
  RiShieldCheckLine,
  RiCoinLine,
  RiStoreLine,
  RiTimeLine,
  RiLockLine,
} from 'react-icons/ri';

/**
 * RewardPrompt — "You earned SAFI!" popup.
 *
 * Two-step flow:
 *   1. celebrate — show the amount earned
 *   2. invite    — explain benefits + sign-up CTA
 *
 * Props:
 *   reward         — { safiEarned, kshCashback, merchantName, pendingId }
 *   onDismiss      — called when user taps "Maybe later"
 *   onSignUp       — called when user taps "Claim cashback"
 *   autoShowDelay  — ms before popup appears (default 1500)
 */
export default function RewardPrompt({ reward, onDismiss, onSignUp, autoShowDelay = 1500 }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState('celebrate'); // 'celebrate' | 'invite'
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), autoShowDelay);
    return () => clearTimeout(t);
  }, [autoShowDelay]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  const handleClaim = () => {
    setVisible(false);
    if (reward?.pendingId) {
      navigate(`/claim/${reward.pendingId}`);
    } else {
      navigate('/register');
    }
    onSignUp?.();
  };

  if (!reward) return null;

  const benefits = [
    {
      icon: <RiCoinLine size={18} />,
      title: 'Yours to keep',
      desc:  'Stored on the blockchain — no one can take it',
    },
    {
      icon: <RiStoreLine size={18} />,
      title: 'Use anywhere',
      desc:  'Redeem at any enrolled restaurant',
    },
    {
      icon: <RiTimeLine size={18} />,
      title: '6 months to claim',
      desc:  'After that your cashback expires',
    },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="rp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />

          {/* Card */}
          <motion.div
            className="rp-card"
            initial={{ opacity: 0, y: 80, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.94 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            {/* Close */}
            <button className="rp-close" onClick={handleDismiss} aria-label="Close">
              &#215;
            </button>

            <AnimatePresence mode="wait">
              {step === 'celebrate' ? (
                <motion.div
                  key="celebrate"
                  className="rp-body"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  {/* Header */}
                  <div className="rp-header">
                    <span className="rp-header-icon">
                      <RiSparklingFill size={38} />
                    </span>
                    <h3 className="rp-header-title">You earned cashback!</h3>
                    <p className="rp-header-sub">at {reward.merchantName}</p>
                  </div>

                  {/* Amount */}
                  <div className="rp-amount-card">
                    <span className="rp-amount-safi">{reward.safiEarned} SAFI</span>
                    <span className="rp-amount-ksh">≈ KES {reward.kshCashback}</span>
                    <span className="rp-amount-label">cashback earned</span>
                  </div>

                  <button className="rp-cta-primary" onClick={() => setStep('invite')}>
                    Claim my cashback
                  </button>
                  <button className="rp-cta-dismiss" onClick={handleDismiss}>
                    Maybe later
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="invite"
                  className="rp-body"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="rp-header">
                    <span className="rp-header-icon">
                      <RiShieldCheckLine size={38} />
                    </span>
                    <h3 className="rp-header-title">Save your rewards</h3>
                    <p className="rp-header-sub">
                      Sign up to lock in your{' '}
                      <strong>KES {reward.kshCashback}</strong> before it expires
                    </p>
                  </div>

                  <div className="rp-benefits">
                    {benefits.map(b => (
                      <div className="rp-benefit" key={b.title}>
                        <div className="rp-benefit-icon">{b.icon}</div>
                        <div className="rp-benefit-text">
                          <strong>{b.title}</strong>
                          <p>{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="rp-cta-primary" onClick={handleClaim}>
                    Sign up &amp; claim KES {reward.kshCashback}
                  </button>
                  <button className="rp-cta-dismiss" onClick={handleDismiss}>
                    I'll come back later
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="rp-footer">
              <RiLockLine size={12} />
              <span>Secured on XRPL</span>
              <span className="rp-footer-dot" />
              <span>SafiPoints</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
