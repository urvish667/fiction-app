import type React from "react"
import { useState, useEffect } from "react"
import type { Session } from "next-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { PayPalIcon, StripeIcon, BuyMeACoffeeIcon, KofiIcon } from '@/components/icons/payment-icons';

// Donation Settings Types
interface DonationSettingsData {
  id?: string;
  donationsEnabled: boolean;
  donationMethod: 'PAYPAL' | 'STRIPE' | 'BMC' | 'KOFI' | null;
  donationLink: string | null;
}

interface MonetizationSettingsProps {
  session: Session | null;
  donationSettings: DonationSettingsData | null;
  isLoadingDonations: boolean;
  isSavingDonations: boolean;
  donationError: string | null;
  enableDonations: boolean;
  donationMethod: 'PAYPAL' | 'STRIPE' | 'BMC' | 'KOFI' | null;
  donationLink: string;
  handleEnableDonationToggle: (checked: boolean) => void;
  handleDonationMethodChange: (value: string) => void;
  handleConnectStripe: () => void;
  handleSaveDonationChanges: (linkOverride?: string) => Promise<void>;
  setIsSavingDonations: React.Dispatch<React.SetStateAction<boolean>>;
  setDonationError: React.Dispatch<React.SetStateAction<string | null>>;
  setDonationLink: React.Dispatch<React.SetStateAction<string>>;
}

// Username validation functions
const validateBuyMeACoffeeUsername = (username: string): boolean => {
  // Buy Me a Coffee usernames are alphanumeric with optional hyphens
  // They typically don't allow spaces or special characters
  const regex = /^[a-zA-Z0-9-]+$/;
  return regex.test(username);
};

const validateKofiUsername = (username: string): boolean => {
  // Ko-fi usernames are alphanumeric with optional hyphens and underscores
  const regex = /^[a-zA-Z0-9-_]+$/;
  return regex.test(username);
};

const MonetizationSettings: React.FC<MonetizationSettingsProps> = ({
  session,
  donationSettings,
  isLoadingDonations,
  isSavingDonations,
  donationError,
  enableDonations,
  donationMethod,
  donationLink,
  handleEnableDonationToggle,
  handleDonationMethodChange,
  handleConnectStripe,
  handleSaveDonationChanges,
  setIsSavingDonations,
  setDonationError,
  setDonationLink
}) => {
  // State for external platform usernames
  const [externalUsername, setExternalUsername] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Set initial external username when donation settings load or method changes
  useEffect(() => {
    if (donationSettings && (donationMethod === 'BMC' || donationMethod === 'KOFI')) {
      setExternalUsername(donationSettings.donationLink || '');
    } else {
      setExternalUsername('');
    }
    setUsernameError(null);
  }, [donationSettings, donationMethod]);

  // Validate username when it changes
  const validateUsername = () => {
    if (!externalUsername) {
      setUsernameError('Username is required');
      return false;
    }

    if (donationMethod === 'BMC') {
      if (!validateBuyMeACoffeeUsername(externalUsername)) {
        setUsernameError('Buy Me a Coffee username can only contain letters, numbers, and hyphens');
        return false;
      }
    } else if (donationMethod === 'KOFI') {
      if (!validateKofiUsername(externalUsername)) {
        setUsernameError('Ko-fi username can only contain letters, numbers, hyphens, and underscores');
        return false;
      }
    }

    setUsernameError(null);
    return true;
  };
  // Modified save function to handle external platforms
  const handleSave = async () => {
    if (donationMethod === 'BMC' || donationMethod === 'KOFI') {
      if (!validateUsername()) {
        return; // Don't proceed if validation fails
      }
      // Pass the username directly to the save function
      await handleSaveDonationChanges(externalUsername);
    } else {
      // For other methods like PayPal, the parent's state is already up-to-date
      await handleSaveDonationChanges();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monetization / Donations</CardTitle>
        <CardDescription>Choose how you want to receive payments from your supporters. You can use PayPal, Stripe, or connect external platforms like Buy Me a Coffee and Ko-fi.</CardDescription>
        <p className="text-sm text-muted-foreground pt-2">
          <b>Note:</b> We are actively working on integrating PayPal and Stripe for more direct and seamless donation experiences.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoadingDonations ? (
          <div className="flex items-center justify-center p-8"><p>Loading donation settings...</p></div>
        ) : (
          <div className="space-y-6">
            {donationError && <p className="text-red-500 mb-4">Error: {donationError}</p>}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="enable-donations" className="text-base font-medium">
                  Enable Donations
                </Label>
                <p className="text-sm text-muted-foreground">Allow your readers to support your work directly.</p>
              </div>
              <Switch
                id="enable-donations"
                checked={enableDonations}
                onCheckedChange={handleEnableDonationToggle}
                aria-label="Enable or disable donations"
              />
            </div>

            {enableDonations && (
              <div className="space-y-4 pt-6 border-t">
                <Label className="block text-base font-medium mb-3">Payment Method</Label>
                <p className="text-sm text-muted-foreground mb-4">Choose how you want to receive payments. Your supporters will be able to pay using their preferred method, regardless of which one you choose.</p>
                <RadioGroup
                  value={donationMethod || ''}
                  onValueChange={handleDonationMethodChange}
                  className="space-y-3"
                >
                  <Label htmlFor="paypal" className="flex items-center space-x-3 p-4 border rounded-md transition-colors">
                    <RadioGroupItem value="PAYPAL" id="paypal" disabled={true} />
                    <PayPalIcon className="w-6 h-6" />
                    <div className="space-y-1">
                      <span className="font-medium">PayPal (Coming Soon)</span>
                      <p className="text-sm text-muted-foreground">Direct integration with PayPal is currently in development.</p>
                    </div>
                  </Label>
                  <Label htmlFor="stripe" className="flex items-center space-x-3 p-4 border rounded-md transition-colors">
                    <RadioGroupItem value="STRIPE" id="stripe" disabled={true} />
                    <StripeIcon className="w-6 h-6" />
                    <div className="space-y-1">
                      <span className="font-medium">Stripe (Coming Soon)</span>
                      <p className="text-sm text-muted-foreground">Direct integration with Stripe is currently in development.</p>
                    </div>
                  </Label>
                  <Label htmlFor="buymeacoffee" className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="BMC" id="buymeacoffee" />
                    <BuyMeACoffeeIcon className="w-6 h-6" />
                    <div className="space-y-1">
                      <span className="font-medium">Buy Me a Coffee</span>
                      <p className="text-sm text-muted-foreground">Connect your Buy Me a Coffee account</p>
                    </div>
                  </Label>
                  <Label htmlFor="kofi" className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="KOFI" id="kofi" />
                    <KofiIcon className="w-6 h-6" />
                    <div className="space-y-1">
                      <span className="font-medium">Ko-fi</span>
                      <p className="text-sm text-muted-foreground">Connect your Ko-fi account</p>
                    </div>
                  </Label>
                </RadioGroup>

                {donationMethod === 'PAYPAL' && (
                  <div className="space-y-2 pt-4 pl-2">
                    <p className="text-sm text-muted-foreground">
                      We are working on direct PayPal integration. Once available, you will be able to connect your PayPal account here.
                    </p>
                  </div>
                )}

                {donationMethod === 'STRIPE' && (
                  <div className="space-y-2 pt-4 pl-2">
                    <p className="text-sm text-muted-foreground">
                      We are working on direct Stripe integration. Once available, you will be able to connect your Stripe account here.
                    </p>
                  </div>
                )}

                {donationMethod === 'BMC' && (
                  <div className="space-y-4 pt-4 pl-2">
                    <div className="space-y-2">
                      <Label htmlFor="buymeacoffee-username" className="text-sm font-medium">Buy Me a Coffee Username</Label>
                      <Input
                        id="buymeacoffee-username"
                        type="text"
                        value={externalUsername}
                        onChange={(e) => {
                          setExternalUsername(e.target.value);
                          setUsernameError(null);
                        }}
                        onBlur={validateUsername}
                        placeholder="e.g., yourname"
                        disabled={isSavingDonations}
                        className="max-w-md"
                      />
                      {usernameError && (
                        <p className="text-xs text-red-500 pt-1">{usernameError}</p>
                      )}
                      {donationSettings?.donationMethod === 'BMC' && donationSettings?.donationLink && (
                        <p className="text-xs text-muted-foreground pt-1">(Current: {donationSettings.donationLink})</p>
                      )}
                      <p className="text-xs text-muted-foreground pt-1">
                        Enter your Buy Me a Coffee username without any URL prefix.
                      </p>
                    </div>
                  </div>
                )}

                {donationMethod === 'KOFI' && (
                  <div className="space-y-4 pt-4 pl-2">
                    <div className="space-y-2">
                      <Label htmlFor="kofi-username" className="text-sm font-medium">Ko-fi Username</Label>
                      <Input
                        id="kofi-username"
                        type="text"
                        value={externalUsername}
                        onChange={(e) => {
                          setExternalUsername(e.target.value);
                          setUsernameError(null);
                        }}
                        onBlur={validateUsername}
                        placeholder="e.g., yourname"
                        disabled={isSavingDonations}
                        className="max-w-md"
                      />
                      {usernameError && (
                        <p className="text-xs text-red-500 pt-1">{usernameError}</p>
                      )}
                      {donationSettings?.donationMethod === 'KOFI' && donationSettings?.donationLink && (
                        <p className="text-xs text-muted-foreground pt-1">(Current: {donationSettings.donationLink})</p>
                      )}
                      <p className="text-xs text-muted-foreground pt-1">
                        Enter your Ko-fi username without any URL prefix.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      {!isLoadingDonations && (
        <CardFooter className="border-t px-6 py-4">
          <Button
            onClick={handleSave}
            disabled={isSavingDonations || isLoadingDonations}
            className="ml-auto"
          >
            {isSavingDonations ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export default MonetizationSettings
