import type React from "react"
import type { Session } from "next-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

// Donation Settings Types
interface DonationSettingsData {
  donationsEnabled: boolean;
  donationMethod: 'paypal' | 'stripe' | null;
  donationLink: string | null;
}

interface MonetizationSettingsProps {
  session: Session | null;
  donationSettings: DonationSettingsData | null;
  isLoadingDonations: boolean;
  isSavingDonations: boolean;
  donationError: string | null;
  enableDonations: boolean;
  donationMethod: 'paypal' | 'stripe' | null;
  paypalLink: string;
  handleEnableDonationToggle: (checked: boolean) => void;
  handleDonationMethodChange: (value: string) => void;
  // handleConnectStripe: () => void; // Temporarily disabled with Stripe
  handleSaveDonationChanges: () => Promise<void>;
  setIsSavingDonations: React.Dispatch<React.SetStateAction<boolean>>;
  setDonationError: React.Dispatch<React.SetStateAction<string | null>>;
  setPaypalLink: React.Dispatch<React.SetStateAction<string>>;
}

const MonetizationSettings: React.FC<MonetizationSettingsProps> = ({
  session,
  donationSettings,
  isLoadingDonations,
  isSavingDonations,
  donationError,
  enableDonations,
  donationMethod,
  paypalLink,
  handleEnableDonationToggle,
  handleDonationMethodChange,
  // handleConnectStripe,
  handleSaveDonationChanges,
  setIsSavingDonations,
  setDonationError,
  setPaypalLink
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monetization / Donations</CardTitle>
        <CardDescription>Choose how you want to receive payments from your supporters. You can use either PayPal or Stripe - your supporters won't need to know which one you're using.</CardDescription>
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
                  <Label htmlFor="paypal" className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <div className="space-y-1">
                      <span className="font-medium">PayPal</span>
                      <p className="text-sm text-muted-foreground">Receive payments directly to your PayPal account</p>
                    </div>
                  </Label>
                  {/* Stripe option visually disabled */}
                  <div className="relative">
                    <Label htmlFor="stripe" className="flex items-center space-x-3 p-4 border rounded-md cursor-not-allowed opacity-30 blur-sm transition-colors">
                      <RadioGroupItem value="stripe" id="stripe" disabled={true} />
                      <div className="space-y-1">
                        <span className="font-medium">Stripe</span>
                        <p className="text-sm text-muted-foreground">Receive payments directly to your bank account</p>
                        <span className="text-xs text-muted-foreground">(Temporarily disabled)</span>
                      </div>
                    </Label>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                        STRIPE TEMPORARILY DISABLED
                      </span>
                    </div>
                  </div>
                </RadioGroup>

                {donationMethod === 'paypal' && (
                  <div className="space-y-2 pt-4 pl-2">
                    <Label htmlFor="paypal-link" className="text-sm font-medium">PayPal.me Link or Email</Label>
                    <Input
                      id="paypal-link"
                      type="text"
                      value={paypalLink}
                      onChange={(e) => setPaypalLink(e.target.value)}
                      placeholder="e.g., paypal.me/yourname or your@email.com"
                      disabled={isSavingDonations}
                      className="max-w-md"
                    />
                    {donationSettings?.donationMethod === 'paypal' && (
                        <p className="text-xs text-muted-foreground pt-1">(Current: {donationSettings.donationLink ?? 'N/A'})</p>
                    )}
                  </div>
                )}

                {donationMethod === 'stripe' && (
                  <div className="space-y-2 pt-4 pl-2 relative">
                    <div className="opacity-30 blur-sm pointer-events-none">
                      {donationSettings?.donationMethod === 'stripe' && donationSettings?.donationLink ? (
                        <div className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-600" />
                          <p className="text-sm text-green-600">Stripe account connected</p>
                          <p className="text-xs text-muted-foreground">(ID: {donationSettings.donationLink ?? 'N/A'})</p>
                        </div>
                      ) : (
                        <div>
                          {/* <Button onClick={handleConnectStripe} disabled={true}> */}
                          <Button disabled={true}>
                              Connect Stripe Account
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">Stripe integration is temporarily disabled.</p>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                        STRIPE DISABLED
                      </span>
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
            onClick={handleSaveDonationChanges}
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
