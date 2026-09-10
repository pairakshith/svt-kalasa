/**
 * English (Latin) to Kannada Phonetic Transliteration Engine
 */
const Transliterate = {
  vowels: {
    'a': 'ಅ', 'aa': 'ಆ', 'i': 'ಇ', 'ee': 'ಈ', 'u': 'ಉ', 'oo': 'ಊ',
    'e': 'ಎ', 'ea': 'ಏ', 'ai': 'ಐ', 'o': 'ಒ', 'oa': 'ಓ', 'au': 'ಔ'
  },
  matras: {
    'a': '', 'aa': 'ಾ', 'i': 'ಿ', 'ee': 'ೀ', 'u': 'ು', 'oo': 'ೂ',
    'e': 'ೆ', 'ea': 'ೇ', 'ai': 'ೈ', 'o': 'ೊ', 'oa': 'ೋ', 'au': 'ೌ'
  },
  consonants: {
    'k': 'ಕ್', 'kh': 'ಖ್', 'g': 'ಗ್', 'gh': 'ಘ್',
    'ch': 'ಚ್', 'chh': 'ಛ್', 'j': 'ಜ್', 'jh': 'ಝ್',
    't': 'ತ್', 'th': 'ಥ್', 'd': 'ದ್', 'dh': 'ಧ್', 'n': 'ನ್',
    'T': 'ಟ್', 'Th': 'ಠ್', 'D': 'ಡ್', 'Dh': 'ಢ್', 'N': 'ಣ್',
    'p': 'ಪ್', 'ph': 'ಫ್', 'f': 'ಫ್', 'b': 'ಬ್', 'bh': 'ಭ್', 'm': 'ಮ್',
    'y': 'ಯ್', 'r': 'ರ್', 'l': 'ಲ್', 'v': 'ವ್', 'w': 'ವ್',
    'sh': 'ಶ್', 's': 'ಸ್', 'h': 'ಹ್', 'L': 'ಳ್'
  },

  // Converts English script to Kannada Unicode
  toKannada(text) {
    if (!text) return '';
    let input = text.toLowerCase();
    let result = '';
    let i = 0;

    // Direct word replacements for common Kannada terms
    const customDictionary = {
      'kalasa': 'ಕಳಸ',
      'svt': 'ಎಸ್.ವಿ.ಟಿ',
      'pooja': 'ಪೂಜೆ',
      'puja': 'ಪೂಜೆ',
      'seva': 'ಸೇವೆ',
      'temple': 'ದೇವಾಲಯ',
      'devasthana': 'ದೇವಸ್ಥಾನ',
      'utsava': 'ಉತ್ಸವ'
    };

    if (customDictionary[input]) {
      return customDictionary[input];
    }

    while (i < input.length) {
      let matched = false;

      // Check 3-char consonants (e.g. chh)
      if (i + 2 < input.length) {
        let sub3 = input.substring(i, i + 3);
        if (this.consonants[sub3]) {
          result += this.consonants[sub3];
          i += 3;
          matched = true;
        }
      }

      // Check 2-char consonants or vowels
      if (!matched && i + 1 < input.length) {
        let sub2 = input.substring(i, i + 2);
        if (this.consonants[sub2]) {
          result += this.consonants[sub2];
          i += 2;
          matched = true;
        } else if (this.vowels[sub2] && i === 0) {
          result += this.vowels[sub2];
          i += 2;
          matched = true;
        }
      }

      // Single character processing
      if (!matched) {
        let char = input[i];
        if (this.consonants[char]) {
          result += this.consonants[char];
        } else {
          result += char;
        }
        i++;
      }
    }

    // Clean up viramas ( halant '್' ) where vowels follow naturally
    return result.replace(/್a/g, '').replace(/್aa/g, 'ಾ').replace(/್i/g, 'ಿ')
                 .replace(/್ee/g, 'ೀ').replace(/್u/g, 'ು').replace(/್oo/g, 'ೂ')
                 .replace(/್e/g, 'ೆ').replace(/್o/g, 'ೊ');
  }
};