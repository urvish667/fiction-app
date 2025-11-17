#!/usr/bin/env node

/**
 * Debug script to test image URL construction and loading
 */

console.log('🔍 Image Debug Tool\n');

// Test cases for different image inputs
const testCases = [
  null,
  undefined,
  'stories/covers/test.jpg',
  'https://api.fablespace.com/api/v1/images/stories%2Fcovers%2Ftest.jpg'
];

// Mock ImageService functions
function mockGetImageUrl(imageInput) {
  if (!imageInput) return null;

  // If it's already a full URL (starts with http), return as-is
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    return imageInput;
  }

  // Otherwise, construct the URL from the image key
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
  return `${baseUrl}/images/${encodeURIComponent(imageInput)}`;
}

// Test each case
console.log('Testing ImageService.getImageUrl():');
testCases.forEach((testCase, index) => {
  const result = mockGetImageUrl(testCase);
  console.log(`${index + 1}. Input: ${testCase}`);
  console.log(`   Output: ${result}\n`);
});

// Environment check
console.log('📋 Environment Check:');
console.log(`NEXT_PUBLIC_API_BASE_URL: ${process.env.NEXT_PUBLIC_API_BASE_URL || 'NOT SET'}`);
console.log(`Node Environment: ${process.env.NODE_ENV || 'NOT SET'}\n`);

// Suggested fixes
console.log('💡 Suggested Fixes:');
console.log('1. Check that your backend is running on port 4000');
console.log('2. Verify CORS headers are set in backend ImageController');
console.log('3. Test direct URL access: http://localhost:4000/api/v1/images/test-image-key');
console.log('4. Check browser Network tab for 404/CORS errors');
console.log('5. If backend returns keys instead of URLs, adjust ImageService accordingly');
