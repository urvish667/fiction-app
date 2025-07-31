export const isUser18OrOlder = (birthdate: Date): boolean => {
  const today = new Date();
  const age = today.getFullYear() - birthdate.getFullYear();
  const m = today.getMonth() - birthdate.getMonth();

  return age > 18 || (age === 18 && m >= 0 && today.getDate() >= birthdate.getDate());
}