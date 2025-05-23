export const licenses = [
  { 
    value: "ALL_RIGHTS_RESERVED", 
    label: "All Rights Reserved", 
    description: "No one can reuse or share without permission.",
    fullDescription: "This work is protected by copyright. All rights are reserved by the author. No part of this work may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the author."
  },
  { 
    value: "CC_BY", 
    label: "CC BY", 
    description: "Others can use with credit.",
    fullDescription: "This work is licensed under Creative Commons Attribution 4.0. You are free to share and adapt this work for any purpose, even commercially, as long as you give appropriate credit to the author."
  },
  { 
    value: "CC_BY_SA", 
    label: "CC BY-SA", 
    description: "Use with credit. Derivatives must keep the same license.",
    fullDescription: "This work is licensed under Creative Commons Attribution-ShareAlike 4.0. You are free to share and adapt this work for any purpose, even commercially, as long as you give appropriate credit and license your contributions under the same license."
  },
  { 
    value: "CC_BY_NC", 
    label: "CC BY-NC", 
    description: "Non-commercial use only, with credit.",
    fullDescription: "This work is licensed under Creative Commons Attribution-NonCommercial 4.0. You are free to share and adapt this work for non-commercial purposes only, as long as you give appropriate credit to the author."
  },
  { 
    value: "CC_BY_ND", 
    label: "CC BY-ND", 
    description: "No edits allowed. Can be shared with credit.",
    fullDescription: "This work is licensed under Creative Commons Attribution-NoDerivatives 4.0. You are free to share this work for any purpose, even commercially, as long as you give appropriate credit and do not make any changes to the original work."
  },
  { 
    value: "CC_BY_NC_SA", 
    label: "CC BY-NC-SA", 
    description: "Non-commercial, same license, with credit.",
    fullDescription: "This work is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0. You are free to share and adapt this work for non-commercial purposes only, as long as you give appropriate credit and license your contributions under the same license."
  },
  { 
    value: "CC_BY_NC_ND", 
    label: "CC BY-NC-ND", 
    description: "No edits, non-commercial, credit required.",
    fullDescription: "This work is licensed under Creative Commons Attribution-NonCommercial-NoDerivatives 4.0. You are free to share this work for non-commercial purposes only, as long as you give appropriate credit and do not make any changes to the original work."
  },
  { 
    value: "CC0", 
    label: "CC0 (Public Domain)", 
    description: "No rights reserved. Anyone can use this work for any purpose, without attribution.",
    fullDescription: "This work has been released into the public domain using Creative Commons CC0. The author has waived all copyright and related rights. You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission."
  }
];

export type LicenseType = typeof licenses[number]["value"];

export const getLicenseByValue = (value: string) => {
  return licenses.find(license => license.value === value);
};

export const getLicenseLabel = (value: string) => {
  const license = getLicenseByValue(value);
  return license ? license.label : "All Rights Reserved";
};

export const getLicenseDescription = (value: string) => {
  const license = getLicenseByValue(value);
  return license ? license.description : "No one can reuse or share without permission.";
};

export const getLicenseFullDescription = (value: string) => {
  const license = getLicenseByValue(value);
  return license ? license.fullDescription : "This work is protected by copyright. All rights are reserved by the author.";
};
