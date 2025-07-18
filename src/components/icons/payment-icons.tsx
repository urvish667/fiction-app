import type React from 'react';

export const PayPalIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img 
    src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/PayPal_Logo_Icon_2014.svg/120px-PayPal_Logo_Icon_2014.svg.png"
    alt="PayPal"
    width={24}
    height={24}
    {...props}
  />
);

export const StripeIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img 
    src="https://stripe.com/img/v3/home/twitter.png"
    alt="Stripe"
    width={24}
    height={24}
    {...props}
  />
);

export const BuyMeACoffeeIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img 
    src="https://cdn.buymeacoffee.com/"
    alt="Buy Me A Coffee"
    width={24}
    height={24}
    style={{ objectFit: 'contain' }}
    {...props}
  />
);

export const KofiIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img 
    src="https://storage.ko-fi.com/cdn/kofi_stroke_cup.svg"
    alt="Ko-fi"
    width={24}
    height={24}
    style={{ objectFit: 'contain' }}
    {...props}
  />
);