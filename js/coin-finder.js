const WORLD = [
  { code: 'USD', flag: '🇺🇸', name: 'United States', symbol: '$', usd: 1 },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro area', symbol: '€', usd: 1.1 },
  { code: 'GBP', flag: '🇬🇧', name: 'United Kingdom', symbol: '£', usd: 1.28 },
  { code: 'CAD', flag: '🇨🇦', name: 'Canada', symbol: 'CA$', usd: 0.73 },
  { code: 'MXN', flag: '🇲🇽', name: 'Mexico', symbol: 'MX$', usd: 0.054 },
  { code: 'JPY', flag: '🇯🇵', name: 'Japan', symbol: '¥', usd: 0.0068, whole: true },
  { code: 'AUD', flag: '🇦🇺', name: 'Australia', symbol: 'A$', usd: 0.66 },
  { code: 'NZD', flag: '🇳🇿', name: 'New Zealand', symbol: 'NZ$', usd: 0.59 },
  { code: 'CNY', flag: '🇨🇳', name: 'China', symbol: 'CN¥', usd: 0.14 },
  { code: 'HKD', flag: '🇭🇰', name: 'Hong Kong', symbol: 'HK$', usd: 0.13 },
  { code: 'TWD', flag: '🇹🇼', name: 'Taiwan', symbol: 'NT$', usd: 0.031 },
  { code: 'KRW', flag: '🇰🇷', name: 'South Korea', symbol: '₩', usd: 0.00072, whole: true },
  { code: 'INR', flag: '🇮🇳', name: 'India', symbol: '₹', usd: 0.012 },
  { code: 'PKR', flag: '🇵🇰', name: 'Pakistan', symbol: 'Rs', usd: 0.0036 },
  { code: 'BDT', flag: '🇧🇩', name: 'Bangladesh', symbol: '৳', usd: 0.0082 },
  { code: 'THB', flag: '🇹🇭', name: 'Thailand', symbol: '฿', usd: 0.031 },
  { code: 'VND', flag: '🇻🇳', name: 'Vietnam', symbol: '₫', usd: 0.000038, whole: true },
  { code: 'IDR', flag: '🇮🇩', name: 'Indonesia', symbol: 'Rp', usd: 0.000061, whole: true },
  { code: 'MYR', flag: '🇲🇾', name: 'Malaysia', symbol: 'RM', usd: 0.23 },
  { code: 'PHP', flag: '🇵🇭', name: 'Philippines', symbol: '₱', usd: 0.018 },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore', symbol: 'S$', usd: 0.78 },
  { code: 'BRL', flag: '🇧🇷', name: 'Brazil', symbol: 'R$', usd: 0.19 },
  { code: 'ARS', flag: '🇦🇷', name: 'Argentina', symbol: 'AR$', usd: 0.00075 },
  { code: 'CLP', flag: '🇨🇱', name: 'Chile', symbol: 'CLP$', usd: 0.00105, whole: true },
  { code: 'COP', flag: '🇨🇴', name: 'Colombia', symbol: 'COL$', usd: 0.00025, whole: true },
  { code: 'PEN', flag: '🇵🇪', name: 'Peru', symbol: 'S/', usd: 0.28 },
  { code: 'CHF', flag: '🇨🇭', name: 'Switzerland', symbol: 'CHF ', usd: 1.16 },
  { code: 'SEK', flag: '🇸🇪', name: 'Sweden', symbol: 'kr', usd: 0.095 },
  { code: 'NOK', flag: '🇳🇴', name: 'Norway', symbol: 'kr', usd: 0.095 },
  { code: 'DKK', flag: '🇩🇰', name: 'Denmark', symbol: 'kr', usd: 0.15 },
  { code: 'PLN', flag: '🇵🇱', name: 'Poland', symbol: 'zł', usd: 0.26 },
  { code: 'CZK', flag: '🇨🇿', name: 'Czechia', symbol: 'Kč', usd: 0.045 },
  { code: 'HUF', flag: '🇭🇺', name: 'Hungary', symbol: 'Ft', usd: 0.0028, whole: true },
  { code: 'RON', flag: '🇷🇴', name: 'Romania', symbol: 'lei', usd: 0.22 },
  { code: 'TRY', flag: '🇹🇷', name: 'Turkey', symbol: '₺', usd: 0.029 },
  { code: 'UAH', flag: '🇺🇦', name: 'Ukraine', symbol: '₴', usd: 0.024 },
  { code: 'ILS', flag: '🇮🇱', name: 'Israel', symbol: '₪', usd: 0.27 },
  { code: 'AED', flag: '🇦🇪', name: 'United Arab Emirates', symbol: 'AED ', usd: 0.27 },
  { code: 'SAR', flag: '🇸🇦', name: 'Saudi Arabia', symbol: 'SAR ', usd: 0.27 },
  { code: 'EGP', flag: '🇪🇬', name: 'Egypt', symbol: 'E£', usd: 0.021 },
  { code: 'ZAR', flag: '🇿🇦', name: 'South Africa', symbol: 'R', usd: 0.056 },
  { code: 'NGN', flag: '🇳🇬', name: 'Nigeria', symbol: '₦', usd: 0.00065 },
  { code: 'KES', flag: '🇰🇪', name: 'Kenya', symbol: 'KSh', usd: 0.0077 },
  { code: 'MAD', flag: '🇲🇦', name: 'Morocco', symbol: 'MAD ', usd: 0.1 },
];

const FX = Object.fromEntries(WORLD.map((row) => [row.code, row.usd]));
const WORLD_BY_CODE = Object.fromEntries(WORLD.map((row) => [row.code, row]));

const CATALOG = [
  item('us-penny', 'Lincoln Cent', 'United States', '🇺🇸', 'coin', 0.01, 'USD', ['copper', 'brown'], { size: 'small' },
    'Circulated pennies are worth 1¢. Wheat cents (1909–1958) often sell for a few cents to a few dollars.'),
  item('us-nickel', 'Jefferson Nickel', 'United States', '🇺🇸', 'coin', 0.05, 'USD', ['silver'], { size: 'medium' },
    'Face value unless it is a wartime silver nickel (1942–1945), which can be a dollar or more.'),
  item('us-dime', 'Roosevelt Dime', 'United States', '🇺🇸', 'coin', 0.1, 'USD', ['silver'], { size: 'small' },
    'Clad dimes are worth 10¢. Dimes dated 1964 or earlier are 90% silver and often $2–$3.'),
  item('us-quarter', 'Washington Quarter', 'United States', '🇺🇸', 'coin', 0.25, 'USD', ['silver'], { size: 'medium' },
    'Most quarters are worth 25¢. Pre-1965 silver quarters commonly bring $5–$8 for melt value.'),
  item('us-half', 'Kennedy Half Dollar', 'United States', '🇺🇸', 'coin', 0.5, 'USD', ['silver'], { size: 'large' },
    'Still legal tender at 50¢. 1964 halves are 90% silver; 1965–1970 are 40% silver.'),
  item('us-dollar-coin', 'Dollar Coin', 'United States', '🇺🇸', 'coin', 1, 'USD', ['gold'], { size: 'large' },
    'Sacagawea, Native American, and Presidential dollars are worth $1 in change.'),
  item('us-1', 'One Dollar Bill', 'United States', '🇺🇸', 'bill', 1, 'USD', ['green'], {},
    'A normal $1 Federal Reserve note is worth one dollar. Fancy serial numbers can sell for more.'),
  item('us-2', 'Two Dollar Bill', 'United States', '🇺🇸', 'bill', 2, 'USD', ['green'], {},
    'Still printed and worth $2. Crisp uncirculated notes sometimes sell for a small premium.'),
  item('us-5', 'Five Dollar Bill', 'United States', '🇺🇸', 'bill', 5, 'USD', ['green', 'purple'], {},
    'Face value is $5. Older red-seal notes can be collectible.'),
  item('us-10', 'Ten Dollar Bill', 'United States', '🇺🇸', 'bill', 10, 'USD', ['green', 'orange'], {},
    'Worth $10 in spendable cash.'),
  item('us-20', 'Twenty Dollar Bill', 'United States', '🇺🇸', 'bill', 20, 'USD', ['green'], {},
    'The most common ATM note. Spendable value is $20.'),
  item('us-50', 'Fifty Dollar Bill', 'United States', '🇺🇸', 'bill', 50, 'USD', ['green', 'pink'], {},
    'Worth $50. Check the watermark and color-shifting ink if you are unsure it is real.'),
  item('us-100', 'One Hundred Dollar Bill', 'United States', '🇺🇸', 'bill', 100, 'USD', ['green', 'teal'], {},
    'Face value $100. The blue 3-D security ribbon is on series 2009A and later.'),

  item('eu-1c', '1 Euro Cent', 'Euro area', '🇪🇺', 'coin', 0.01, 'EUR', ['copper', 'brown'], { size: 'small' },
    'Copper-covered steel. Spendable value is one cent of a euro.'),
  item('eu-2c', '2 Euro Cent', 'Euro area', '🇪🇺', 'coin', 0.02, 'EUR', ['copper', 'brown'], { size: 'small' },
    'Same copper look as the 1 cent, just a bit larger.'),
  item('eu-5c', '5 Euro Cent', 'Euro area', '🇪🇺', 'coin', 0.05, 'EUR', ['copper'], { size: 'medium' },
    'Copper-colored and still used in most euro countries.'),
  item('eu-10c', '10 Euro Cent', 'Euro area', '🇪🇺', 'coin', 0.1, 'EUR', ['gold'], { size: 'small' },
    'Nordic-gold alloy. Face value is €0.10.'),
  item('eu-20c', '20 Euro Cent', 'Euro area', '🇪🇺', 'coin', 0.2, 'EUR', ['gold'], { size: 'medium' },
    'Gold-colored with a distinctive notched shape.'),
  item('eu-50c', '50 Euro Cent', 'Euro area', '🇪🇺', 'coin', 0.5, 'EUR', ['gold'], { size: 'large' },
    'The largest gold-colored euro coin.'),
  item('eu-1', '1 Euro Coin', 'Euro area', '🇪🇺', 'coin', 1, 'EUR', ['gold', 'silver'], { size: 'medium', bimetal: true },
    'Bimetallic: brass ring, nickel center. Worth €1.'),
  item('eu-2', '2 Euro Coin', 'Euro area', '🇪🇺', 'coin', 2, 'EUR', ['silver', 'gold'], { size: 'large', bimetal: true },
    'Bimetallic with a nickel ring. Commemorative designs can sell above face value.'),
  item('eu-5', '5 Euro Note', 'Euro area', '🇪🇺', 'bill', 5, 'EUR', ['gray'], {},
    'Gray Europa series note. Spendable value is €5.'),
  item('eu-10', '10 Euro Note', 'Euro area', '🇪🇺', 'bill', 10, 'EUR', ['red'], {},
    'Red note. Worth €10.'),
  item('eu-20', '20 Euro Note', 'Euro area', '🇪🇺', 'bill', 20, 'EUR', ['blue'], {},
    'Blue note. Worth €20.'),
  item('eu-50', '50 Euro Note', 'Euro area', '🇪🇺', 'bill', 50, 'EUR', ['orange'], {},
    'Orange note and a common wallet bill in Europe.'),
  item('eu-100', '100 Euro Note', 'Euro area', '🇪🇺', 'bill', 100, 'EUR', ['green'], {},
    'Green note. Worth €100.'),
  item('eu-200', '200 Euro Note', 'Euro area', '🇪🇺', 'bill', 200, 'EUR', ['yellow'], {},
    'Yellow note. Less common in tills.'),

  item('gb-1p', '1 Penny', 'United Kingdom', '🇬🇧', 'coin', 0.01, 'GBP', ['copper'], { size: 'small' },
    'Copper-plated steel since 1992. Worth 1p.'),
  item('gb-2p', '2 Pence', 'United Kingdom', '🇬🇧', 'coin', 0.02, 'GBP', ['copper'], { size: 'medium' },
    'Larger copper-colored coin. Worth 2p.'),
  item('gb-5p', '5 Pence', 'United Kingdom', '🇬🇧', 'coin', 0.05, 'GBP', ['silver'], { size: 'small' },
    'Small silver-colored coin. Worth 5p.'),
  item('gb-10p', '10 Pence', 'United Kingdom', '🇬🇧', 'coin', 0.1, 'GBP', ['silver'], { size: 'medium' },
    'Worth 10p. Many circulating designs exist.'),
  item('gb-20p', '20 Pence', 'United Kingdom', '🇬🇧', 'coin', 0.2, 'GBP', ['silver'], { size: 'small' },
    'Seven-sided silver coin. Worth 20p.'),
  item('gb-50p', '50 Pence', 'United Kingdom', '🇬🇧', 'coin', 0.5, 'GBP', ['silver'], { size: 'large' },
    'The famous seven-sided 50p. Special designs can be worth far more to collectors.'),
  item('gb-1', '1 Pound Coin', 'United Kingdom', '🇬🇧', 'coin', 1, 'GBP', ['gold', 'silver'], { size: 'medium', bimetal: true },
    '12-sided bimetallic £1 introduced in 2017. Worth £1.'),
  item('gb-2', '2 Pound Coin', 'United Kingdom', '🇬🇧', 'coin', 2, 'GBP', ['gold', 'silver'], { size: 'large', bimetal: true },
    'Bimetallic £2. Commemoratives sometimes sell above face.'),
  item('gb-5', '5 Pound Note', 'United Kingdom', '🇬🇧', 'bill', 5, 'GBP', ['teal', 'blue'], {},
    'Polymer Churchill £5. Worth £5.'),
  item('gb-10', '10 Pound Note', 'United Kingdom', '🇬🇧', 'bill', 10, 'GBP', ['orange', 'brown'], {},
    'Polymer Austen £10. Worth £10.'),
  item('gb-20', '20 Pound Note', 'United Kingdom', '🇬🇧', 'bill', 20, 'GBP', ['purple'], {},
    'Polymer Turner £20. Worth £20.'),
  item('gb-50', '50 Pound Note', 'United Kingdom', '🇬🇧', 'bill', 50, 'GBP', ['red'], {},
    'Polymer Turing £50. Worth £50.'),

  item('ca-nickel', '5 Cent Nickel', 'Canada', '🇨🇦', 'coin', 0.05, 'CAD', ['silver'], { size: 'small' },
    'The beaver nickel. Worth 5 Canadian cents.'),
  item('ca-dime', '10 Cent Dime', 'Canada', '🇨🇦', 'coin', 0.1, 'CAD', ['silver'], { size: 'small' },
    'The Bluenose dime. Worth 10¢ CAD.'),
  item('ca-quarter', '25 Cent Quarter', 'Canada', '🇨🇦', 'coin', 0.25, 'CAD', ['silver'], { size: 'medium' },
    'Caribou quarter. Worth 25¢ CAD.'),
  item('ca-loonie', '1 Dollar Loonie', 'Canada', '🇨🇦', 'coin', 1, 'CAD', ['gold'], { size: 'medium' },
    'Gold-colored 11-sided loonie. Worth $1 CAD.'),
  item('ca-toonie', '2 Dollar Toonie', 'Canada', '🇨🇦', 'coin', 2, 'CAD', ['gold', 'silver'], { size: 'large', bimetal: true },
    'Bimetallic polar-bear toonie. Worth $2 CAD.'),
  item('ca-5', '5 Dollar Note', 'Canada', '🇨🇦', 'bill', 5, 'CAD', ['blue'], {},
    'Polymer blue $5. Worth $5 CAD.'),
  item('ca-10', '10 Dollar Note', 'Canada', '🇨🇦', 'bill', 10, 'CAD', ['purple'], {},
    'Polymer purple $10. Worth $10 CAD.'),
  item('ca-20', '20 Dollar Note', 'Canada', '🇨🇦', 'bill', 20, 'CAD', ['green'], {},
    'Polymer green $20. Worth $20 CAD.'),
  item('ca-50', '50 Dollar Note', 'Canada', '🇨🇦', 'bill', 50, 'CAD', ['red'], {},
    'Polymer red $50. Worth $50 CAD.'),

  item('mx-1', '1 Peso Coin', 'Mexico', '🇲🇽', 'coin', 1, 'MXN', ['gold', 'silver'], { size: 'small', bimetal: true },
    'Bimetallic peso. Face value is 1 Mexican peso.'),
  item('mx-5', '5 Peso Coin', 'Mexico', '🇲🇽', 'coin', 5, 'MXN', ['gold', 'silver'], { size: 'medium', bimetal: true },
    'Worth 5 Mexican pesos.'),
  item('mx-10', '10 Peso Coin', 'Mexico', '🇲🇽', 'coin', 10, 'MXN', ['gold', 'silver'], { size: 'medium', bimetal: true },
    'Worth 10 Mexican pesos.'),
  item('mx-20', '20 Peso Note', 'Mexico', '🇲🇽', 'bill', 20, 'MXN', ['blue', 'red'], {},
    'Colorful polymer 20 peso note.'),
  item('mx-50', '50 Peso Note', 'Mexico', '🇲🇽', 'bill', 50, 'MXN', ['purple', 'pink'], {},
    'Polymer 50 peso note.'),
  item('mx-100', '100 Peso Note', 'Mexico', '🇲🇽', 'bill', 100, 'MXN', ['red'], {},
    'Worth 100 Mexican pesos.'),

  item('jp-1', '1 Yen Coin', 'Japan', '🇯🇵', 'coin', 1, 'JPY', ['silver'], { size: 'small' },
    'Lightweight aluminum. Worth ¥1.'),
  item('jp-5', '5 Yen Coin', 'Japan', '🇯🇵', 'coin', 5, 'JPY', ['gold'], { size: 'small' },
    'Brass coin with a hole in the center. Worth ¥5.'),
  item('jp-10', '10 Yen Coin', 'Japan', '🇯🇵', 'coin', 10, 'JPY', ['copper', 'brown'], { size: 'medium' },
    'Bronze Byodo-in coin. Worth ¥10.'),
  item('jp-50', '50 Yen Coin', 'Japan', '🇯🇵', 'coin', 50, 'JPY', ['silver'], { size: 'small' },
    'Cupronickel with a hole. Worth ¥50.'),
  item('jp-100', '100 Yen Coin', 'Japan', '🇯🇵', 'coin', 100, 'JPY', ['silver'], { size: 'medium' },
    'Common vending-machine coin. Worth ¥100.'),
  item('jp-500', '500 Yen Coin', 'Japan', '🇯🇵', 'coin', 500, 'JPY', ['gold', 'silver'], { size: 'large', bimetal: true },
    'Bimetallic ¥500. One of the highest-value coins in daily use.'),
  item('jp-1000', '1000 Yen Note', 'Japan', '🇯🇵', 'bill', 1000, 'JPY', ['blue'], {},
    'Blue ¥1000 note.'),
  item('jp-5000', '5000 Yen Note', 'Japan', '🇯🇵', 'bill', 5000, 'JPY', ['purple'], {},
    'Purple ¥5000 note.'),
  item('jp-10000', '10000 Yen Note', 'Japan', '🇯🇵', 'bill', 10000, 'JPY', ['brown'], {},
    'Brown ¥10000 note.'),

  item('au-5c', '5 Cent Coin', 'Australia', '🇦🇺', 'coin', 0.05, 'AUD', ['silver'], { size: 'small' },
    'Echidna 5c. Worth $0.05 AUD.'),
  item('au-1', '1 Dollar Coin', 'Australia', '🇦🇺', 'coin', 1, 'AUD', ['gold'], { size: 'medium' },
    'Five-kangaroo dollar. Worth $1 AUD.'),
  item('au-2', '2 Dollar Coin', 'Australia', '🇦🇺', 'coin', 2, 'AUD', ['gold'], { size: 'small' },
    'Small gold-colored $2. Worth $2 AUD.'),
  item('au-5', '5 Dollar Note', 'Australia', '🇦🇺', 'bill', 5, 'AUD', ['purple', 'pink'], {},
    'Polymer purple $5.'),
  item('au-10', '10 Dollar Note', 'Australia', '🇦🇺', 'bill', 10, 'AUD', ['blue'], {},
    'Polymer blue $10.'),
  item('au-20', '20 Dollar Note', 'Australia', '🇦🇺', 'bill', 20, 'AUD', ['red'], {},
    'Polymer red $20.'),
  item('au-50', '50 Dollar Note', 'Australia', '🇦🇺', 'bill', 50, 'AUD', ['yellow'], {},
    'Polymer yellow $50.'),

  item('cn-1', '1 Yuan Note', 'China', '🇨🇳', 'bill', 1, 'CNY', ['green', 'olive'], {},
    'Olive-green ¥1 note. Worth 1 yuan.'),
  item('cn-5', '5 Yuan Note', 'China', '🇨🇳', 'bill', 5, 'CNY', ['purple'], {},
    'Purple ¥5 note.'),
  item('cn-10', '10 Yuan Note', 'China', '🇨🇳', 'bill', 10, 'CNY', ['blue'], {},
    'Blue ¥10 note.'),
  item('cn-20', '20 Yuan Note', 'China', '🇨🇳', 'bill', 20, 'CNY', ['brown'], {},
    'Brown ¥20 note.'),
  item('cn-50', '50 Yuan Note', 'China', '🇨🇳', 'bill', 50, 'CNY', ['green'], {},
    'Green ¥50 note.'),
  item('cn-100', '100 Yuan Note', 'China', '🇨🇳', 'bill', 100, 'CNY', ['red'], {},
    'Red ¥100 note, the most common large bill.'),

  item('in-1', '1 Rupee Coin', 'India', '🇮🇳', 'coin', 1, 'INR', ['silver'], { size: 'small' },
    'Stainless rupee coin. Worth ₹1.'),
  item('in-5', '5 Rupee Coin', 'India', '🇮🇳', 'coin', 5, 'INR', ['silver'], { size: 'medium' },
    'Worth ₹5.'),
  item('in-10', '10 Rupee Coin', 'India', '🇮🇳', 'coin', 10, 'INR', ['gold', 'silver'], { size: 'medium', bimetal: true },
    'Bimetallic ₹10.'),
  item('in-50', '50 Rupee Note', 'India', '🇮🇳', 'bill', 50, 'INR', ['teal', 'blue'], {},
    'Fluorescent-blue ₹50.'),
  item('in-100', '100 Rupee Note', 'India', '🇮🇳', 'bill', 100, 'INR', ['purple', 'pink'], {},
    'Lavender ₹100.'),
  item('in-200', '200 Rupee Note', 'India', '🇮🇳', 'bill', 200, 'INR', ['orange'], {},
    'Bright orange ₹200.'),
  item('in-500', '500 Rupee Note', 'India', '🇮🇳', 'bill', 500, 'INR', ['gray', 'green'], {},
    'Stone-gray ₹500.'),

  item('br-1', '1 Real Coin', 'Brazil', '🇧🇷', 'coin', 1, 'BRL', ['gold', 'silver'], { size: 'medium', bimetal: true },
    'Bimetallic 1 real. Worth R$1.'),
  item('br-2', '2 Real Note', 'Brazil', '🇧🇷', 'bill', 2, 'BRL', ['blue'], {},
    'Blue R$2 note.'),
  item('br-5', '5 Real Note', 'Brazil', '🇧🇷', 'bill', 5, 'BRL', ['purple'], {},
    'Purple R$5 note.'),
  item('br-10', '10 Real Note', 'Brazil', '🇧🇷', 'bill', 10, 'BRL', ['red'], {},
    'Red R$10 note.'),
  item('br-20', '20 Real Note', 'Brazil', '🇧🇷', 'bill', 20, 'BRL', ['yellow'], {},
    'Yellow R$20 note.'),
  item('br-50', '50 Real Note', 'Brazil', '🇧🇷', 'bill', 50, 'BRL', ['brown', 'orange'], {},
    'Brown-orange R$50 note.'),
  item('br-100', '100 Real Note', 'Brazil', '🇧🇷', 'bill', 100, 'BRL', ['teal', 'blue'], {},
    'Blue R$100 note.'),

  item('th-1', '1 Baht Coin', 'Thailand', '🇹🇭', 'coin', 1, 'THB', ['silver'], { size: 'small' },
    'Cupronickel 1 baht. Worth ฿1.'),
  item('th-2', '2 Baht Coin', 'Thailand', '🇹🇭', 'coin', 2, 'THB', ['silver'], { size: 'small' },
    'Worth ฿2.'),
  item('th-5', '5 Baht Coin', 'Thailand', '🇹🇭', 'coin', 5, 'THB', ['copper', 'silver'], { size: 'medium', bimetal: true },
    'Bimetallic 5 baht. Worth ฿5.'),
  item('th-10', '10 Baht Coin', 'Thailand', '🇹🇭', 'coin', 10, 'THB', ['gold', 'silver'], { size: 'medium', bimetal: true },
    'Bimetallic 10 baht. Worth ฿10.'),
  item('th-20', '20 Baht Note', 'Thailand', '🇹🇭', 'bill', 20, 'THB', ['green', 'teal'], {},
    'Green polymer 20 baht note, often with the king on the front. Worth ฿20.'),
  item('th-50', '50 Baht Note', 'Thailand', '🇹🇭', 'bill', 50, 'THB', ['blue'], {},
    'Blue 50 baht note. Worth ฿50.'),
  item('th-100', '100 Baht Note', 'Thailand', '🇹🇭', 'bill', 100, 'THB', ['red'], {},
    'Red 100 baht note. Worth ฿100.'),
  item('th-500', '500 Baht Note', 'Thailand', '🇹🇭', 'bill', 500, 'THB', ['purple'], {},
    'Purple 500 baht note. Worth ฿500.'),
  item('th-1000', '1000 Baht Note', 'Thailand', '🇹🇭', 'bill', 1000, 'THB', ['brown', 'gray'], {},
    'Brown-gray 1000 baht note. Worth ฿1000.'),

  item('kr-100', '100 Won Coin', 'South Korea', '🇰🇷', 'coin', 100, 'KRW', ['copper'], { size: 'medium' },
    'Copper-colored 100 won. Worth ₩100.'),
  item('kr-500', '500 Won Coin', 'South Korea', '🇰🇷', 'coin', 500, 'KRW', ['silver'], { size: 'medium' },
    'Nickel 500 won. Worth ₩500.'),
  item('kr-1000', '1000 Won Note', 'South Korea', '🇰🇷', 'bill', 1000, 'KRW', ['blue'], {},
    'Blue ₩1000 note.'),
  item('kr-5000', '5000 Won Note', 'South Korea', '🇰🇷', 'bill', 5000, 'KRW', ['orange', 'red'], {},
    'Orange-red ₩5000 note.'),
  item('kr-10000', '10000 Won Note', 'South Korea', '🇰🇷', 'bill', 10000, 'KRW', ['green'], {},
    'Green ₩10000 note.'),

  item('ch-1', '1 Franc Coin', 'Switzerland', '🇨🇭', 'coin', 1, 'CHF', ['silver'], { size: 'medium' },
    'Cupronickel 1 franc. Worth CHF 1.'),
  item('ch-5', '5 Franc Coin', 'Switzerland', '🇨🇭', 'coin', 5, 'CHF', ['silver'], { size: 'large' },
    'The large 5 franc coin. Worth CHF 5.'),
  item('ch-10', '10 Franc Note', 'Switzerland', '🇨🇭', 'bill', 10, 'CHF', ['yellow'], {},
    'Yellow CHF 10 note.'),
  item('ch-20', '20 Franc Note', 'Switzerland', '🇨🇭', 'bill', 20, 'CHF', ['red'], {},
    'Red CHF 20 note.'),
  item('ch-50', '50 Franc Note', 'Switzerland', '🇨🇭', 'bill', 50, 'CHF', ['green'], {},
    'Green CHF 50 note.'),

  item('sg-1', '1 Dollar Coin', 'Singapore', '🇸🇬', 'coin', 1, 'SGD', ['gold'], { size: 'medium' },
    'Gold-colored $1. Worth S$1.'),
  item('sg-2', '2 Dollar Note', 'Singapore', '🇸🇬', 'bill', 2, 'SGD', ['purple', 'pink'], {},
    'Purple polymer S$2.'),
  item('sg-5', '5 Dollar Note', 'Singapore', '🇸🇬', 'bill', 5, 'SGD', ['green'], {},
    'Green polymer S$5.'),
  item('sg-10', '10 Dollar Note', 'Singapore', '🇸🇬', 'bill', 10, 'SGD', ['red'], {},
    'Red polymer S$10.'),

  item('ph-1', '1 Piso Coin', 'Philippines', '🇵🇭', 'coin', 1, 'PHP', ['silver'], { size: 'small' },
    'Nickel-plated 1 piso. Worth ₱1.'),
  item('ph-20', '20 Piso Note', 'Philippines', '🇵🇭', 'bill', 20, 'PHP', ['orange'], {},
    'Orange polymer ₱20.'),
  item('ph-50', '50 Piso Note', 'Philippines', '🇵🇭', 'bill', 50, 'PHP', ['red'], {},
    'Red ₱50 note.'),
  item('ph-100', '100 Piso Note', 'Philippines', '🇵🇭', 'bill', 100, 'PHP', ['purple'], {},
    'Violet ₱100 note.'),
  item('vn-10000', '10000 Dong Note', 'Vietnam', '🇻🇳', 'bill', 10000, 'VND', ['brown'], {},
    'Polymer ₫10,000 note.'),
  item('vn-20000', '20000 Dong Note', 'Vietnam', '🇻🇳', 'bill', 20000, 'VND', ['blue'], {},
    'Polymer ₫20,000 note.'),
  item('vn-50000', '50000 Dong Note', 'Vietnam', '🇻🇳', 'bill', 50000, 'VND', ['yellow'], {},
    'Polymer ₫50,000 note.'),
  item('vn-100000', '100000 Dong Note', 'Vietnam', '🇻🇳', 'bill', 100000, 'VND', ['green'], {},
    'Polymer ₫100,000 note.'),
  item('id-1000', '1000 Rupiah Coin', 'Indonesia', '🇮🇩', 'coin', 1000, 'IDR', ['silver'], { size: 'medium' },
    'Bi-metal look 1000 rupiah. Worth Rp1,000.'),
  item('id-2000', '2000 Rupiah Note', 'Indonesia', '🇮🇩', 'bill', 2000, 'IDR', ['gray'], {},
    'Gray Rp2,000 note.'),
  item('id-5000', '5000 Rupiah Note', 'Indonesia', '🇮🇩', 'bill', 5000, 'IDR', ['brown'], {},
    'Brown Rp5,000 note.'),
  item('id-10000', '10000 Rupiah Note', 'Indonesia', '🇮🇩', 'bill', 10000, 'IDR', ['purple'], {},
    'Purple Rp10,000 note.'),
  item('my-1', '1 Ringgit Coin', 'Malaysia', '🇲🇾', 'coin', 1, 'MYR', ['gold'], { size: 'medium' },
    'Gold-colored RM1. Worth RM1.'),
  item('my-1n', '1 Ringgit Note', 'Malaysia', '🇲🇾', 'bill', 1, 'MYR', ['blue'], {},
    'Blue polymer RM1.'),
  item('my-5', '5 Ringgit Note', 'Malaysia', '🇲🇾', 'bill', 5, 'MYR', ['green'], {},
    'Green RM5 note.'),
  item('my-10', '10 Ringgit Note', 'Malaysia', '🇲🇾', 'bill', 10, 'MYR', ['red'], {},
    'Red RM10 note.'),
  item('nz-1', '1 Dollar Coin', 'New Zealand', '🇳🇿', 'coin', 1, 'NZD', ['gold'], { size: 'medium' },
    'Gold kiwi dollar. Worth NZ$1.'),
  item('nz-5', '5 Dollar Note', 'New Zealand', '🇳🇿', 'bill', 5, 'NZD', ['orange'], {},
    'Orange polymer NZ$5.'),
  item('nz-10', '10 Dollar Note', 'New Zealand', '🇳🇿', 'bill', 10, 'NZD', ['blue'], {},
    'Blue polymer NZ$10.'),
  item('nz-20', '20 Dollar Note', 'New Zealand', '🇳🇿', 'bill', 20, 'NZD', ['green'], {},
    'Green polymer NZ$20.'),
  item('hk-1', '1 Dollar Coin', 'Hong Kong', '🇭🇰', 'coin', 1, 'HKD', ['silver'], { size: 'small' },
    'Cupronickel HK$1.'),
  item('hk-10', '10 Dollar Note', 'Hong Kong', '🇭🇰', 'bill', 10, 'HKD', ['purple', 'blue'], {},
    'Polymer HK$10.'),
  item('hk-20', '20 Dollar Note', 'Hong Kong', '🇭🇰', 'bill', 20, 'HKD', ['blue'], {},
    'Blue HK$20 note.'),
  item('hk-100', '100 Dollar Note', 'Hong Kong', '🇭🇰', 'bill', 100, 'HKD', ['red'], {},
    'Red HK$100 note.'),
  item('tw-10', '10 Dollar Coin', 'Taiwan', '🇹🇼', 'coin', 10, 'TWD', ['gold'], { size: 'medium' },
    'Brass NT$10. Worth NT$10.'),
  item('tw-100', '100 Dollar Note', 'Taiwan', '🇹🇼', 'bill', 100, 'TWD', ['red'], {},
    'Red NT$100 note.'),
  item('tw-500', '500 Dollar Note', 'Taiwan', '🇹🇼', 'bill', 500, 'TWD', ['brown'], {},
    'Brown NT$500 note.'),
  item('tw-1000', '1000 Dollar Note', 'Taiwan', '🇹🇼', 'bill', 1000, 'TWD', ['blue'], {},
    'Blue NT$1000 note.'),
  item('za-1', '1 Rand Coin', 'South Africa', '🇿🇦', 'coin', 1, 'ZAR', ['copper'], { size: 'small' },
    'Copper-nickel 1 rand. Worth R1.'),
  item('za-5', '5 Rand Coin', 'South Africa', '🇿🇦', 'coin', 5, 'ZAR', ['gold', 'silver'], { size: 'medium', bimetal: true },
    'Bimetallic R5.'),
  item('za-10', '10 Rand Note', 'South Africa', '🇿🇦', 'bill', 10, 'ZAR', ['green'], {},
    'Green R10 note.'),
  item('za-20', '20 Rand Note', 'South Africa', '🇿🇦', 'bill', 20, 'ZAR', ['brown'], {},
    'Brown R20 note.'),
  item('za-50', '50 Rand Note', 'South Africa', '🇿🇦', 'bill', 50, 'ZAR', ['red'], {},
    'Red R50 note.'),
  item('tr-1', '1 Lira Coin', 'Turkey', '🇹🇷', 'coin', 1, 'TRY', ['gold', 'silver'], { size: 'medium', bimetal: true },
    'Bimetallic ₺1.'),
  item('tr-5', '5 Lira Note', 'Turkey', '🇹🇷', 'bill', 5, 'TRY', ['brown'], {},
    'Brown ₺5 note.'),
  item('tr-10', '10 Lira Note', 'Turkey', '🇹🇷', 'bill', 10, 'TRY', ['red'], {},
    'Red ₺10 note.'),
  item('tr-20', '20 Lira Note', 'Turkey', '🇹🇷', 'bill', 20, 'TRY', ['green'], {},
    'Green ₺20 note.'),
  item('tr-50', '50 Lira Note', 'Turkey', '🇹🇷', 'bill', 50, 'TRY', ['orange'], {},
    'Orange ₺50 note.'),
  item('pl-1', '1 Zloty Coin', 'Poland', '🇵🇱', 'coin', 1, 'PLN', ['gold'], { size: 'small' },
    'Brass 1 złoty. Worth 1 zł.'),
  item('pl-10', '10 Zloty Note', 'Poland', '🇵🇱', 'bill', 10, 'PLN', ['brown'], {},
    'Brown 10 zł note.'),
  item('pl-20', '20 Zloty Note', 'Poland', '🇵🇱', 'bill', 20, 'PLN', ['purple'], {},
    'Purple 20 zł note.'),
  item('pl-50', '50 Zloty Note', 'Poland', '🇵🇱', 'bill', 50, 'PLN', ['blue', 'green'], {},
    'Blue-green 50 zł note.'),
  item('se-1', '1 Krona Coin', 'Sweden', '🇸🇪', 'coin', 1, 'SEK', ['copper'], { size: 'small' },
    'Copper-colored 1 krona.'),
  item('se-10', '10 Krona Coin', 'Sweden', '🇸🇪', 'coin', 10, 'SEK', ['gold'], { size: 'medium' },
    'Nordic-gold 10 kronor.'),
  item('se-20', '20 Kronor Note', 'Sweden', '🇸🇪', 'bill', 20, 'SEK', ['purple'], {},
    'Purple 20 kr note.'),
  item('se-100', '100 Kronor Note', 'Sweden', '🇸🇪', 'bill', 100, 'SEK', ['blue'], {},
    'Blue 100 kr note.'),
  item('no-1', '1 Krone Coin', 'Norway', '🇳🇴', 'coin', 1, 'NOK', ['copper'], { size: 'small' },
    'Hole-in-center 1 krone.'),
  item('no-20', '20 Kroner Note', 'Norway', '🇳🇴', 'bill', 20, 'NOK', ['green'], {},
    'Green 20 kr note.'),
  item('no-50', '50 Kroner Note', 'Norway', '🇳🇴', 'bill', 50, 'NOK', ['green', 'teal'], {},
    'Teal 50 kr note.'),
  item('no-100', '100 Kroner Note', 'Norway', '🇳🇴', 'bill', 100, 'NOK', ['red'], {},
    'Red 100 kr note.'),
  item('dk-1', '1 Krone Coin', 'Denmark', '🇩🇰', 'coin', 1, 'DKK', ['silver'], { size: 'small' },
    'Hole-in-center 1 krone.'),
  item('dk-50', '50 Kroner Note', 'Denmark', '🇩🇰', 'bill', 50, 'DKK', ['purple'], {},
    'Purple 50 kr note.'),
  item('dk-100', '100 Kroner Note', 'Denmark', '🇩🇰', 'bill', 100, 'DKK', ['orange'], {},
    'Orange 100 kr note.'),
  item('ae-1', '1 Dirham Coin', 'United Arab Emirates', '🇦🇪', 'coin', 1, 'AED', ['copper'], { size: 'small' },
    'Copper-nickel 1 dirham.'),
  item('ae-5', '5 Dirham Note', 'United Arab Emirates', '🇦🇪', 'bill', 5, 'AED', ['brown'], {},
    'Brown AED 5 note.'),
  item('ae-10', '10 Dirham Note', 'United Arab Emirates', '🇦🇪', 'bill', 10, 'AED', ['green'], {},
    'Green AED 10 note.'),
  item('ae-50', '50 Dirham Note', 'United Arab Emirates', '🇦🇪', 'bill', 50, 'AED', ['purple'], {},
    'Purple AED 50 note.'),
  item('sa-1', '1 Riyal Coin', 'Saudi Arabia', '🇸🇦', 'coin', 1, 'SAR', ['gold', 'silver'], { size: 'medium', bimetal: true },
    'Bimetallic 1 riyal.'),
  item('sa-5', '5 Riyal Note', 'Saudi Arabia', '🇸🇦', 'bill', 5, 'SAR', ['purple'], {},
    'Purple SAR 5 note.'),
  item('sa-10', '10 Riyal Note', 'Saudi Arabia', '🇸🇦', 'bill', 10, 'SAR', ['brown'], {},
    'Brown SAR 10 note.'),
  item('sa-50', '50 Riyal Note', 'Saudi Arabia', '🇸🇦', 'bill', 50, 'SAR', ['green'], {},
    'Green SAR 50 note.'),
  item('eg-1', '1 Pound Coin', 'Egypt', '🇪🇬', 'coin', 1, 'EGP', ['gold', 'silver'], { size: 'medium', bimetal: true },
    'Bimetallic E£1.'),
  item('eg-5', '5 Pound Note', 'Egypt', '🇪🇬', 'bill', 5, 'EGP', ['blue'], {},
    'Blue E£5 note.'),
  item('eg-10', '10 Pound Note', 'Egypt', '🇪🇬', 'bill', 10, 'EGP', ['pink', 'red'], {},
    'Pink E£10 note.'),
  item('eg-20', '20 Pound Note', 'Egypt', '🇪🇬', 'bill', 20, 'EGP', ['green'], {},
    'Green E£20 note.'),
  item('ng-50', '50 Naira Note', 'Nigeria', '🇳🇬', 'bill', 50, 'NGN', ['blue'], {},
    'Blue ₦50 note.'),
  item('ng-100', '100 Naira Note', 'Nigeria', '🇳🇬', 'bill', 100, 'NGN', ['brown'], {},
    'Brown ₦100 note.'),
  item('ng-200', '200 Naira Note', 'Nigeria', '🇳🇬', 'bill', 200, 'NGN', ['green'], {},
    'Green ₦200 note.'),
  item('ng-500', '500 Naira Note', 'Nigeria', '🇳🇬', 'bill', 500, 'NGN', ['red', 'purple'], {},
    'Red-purple ₦500 note.'),
  item('ke-1', '1 Shilling Coin', 'Kenya', '🇰🇪', 'coin', 1, 'KES', ['silver'], { size: 'small' },
    'Bi-metal look 1 shilling.'),
  item('ke-50', '50 Shilling Note', 'Kenya', '🇰🇪', 'bill', 50, 'KES', ['red'], {},
    'Red KSh 50 note.'),
  item('ke-100', '100 Shilling Note', 'Kenya', '🇰🇪', 'bill', 100, 'KES', ['purple'], {},
    'Purple KSh 100 note.'),
  item('ke-200', '200 Shilling Note', 'Kenya', '🇰🇪', 'bill', 200, 'KES', ['blue'], {},
    'Blue KSh 200 note.'),
  item('ma-1', '1 Dirham Coin', 'Morocco', '🇲🇦', 'coin', 1, 'MAD', ['gold'], { size: 'small' },
    'Brass 1 dirham.'),
  item('ma-20', '20 Dirham Note', 'Morocco', '🇲🇦', 'bill', 20, 'MAD', ['orange'], {},
    'Orange MAD 20 note.'),
  item('ma-50', '50 Dirham Note', 'Morocco', '🇲🇦', 'bill', 50, 'MAD', ['green'], {},
    'Green MAD 50 note.'),
  item('ma-100', '100 Dirham Note', 'Morocco', '🇲🇦', 'bill', 100, 'MAD', ['brown'], {},
    'Brown MAD 100 note.'),
  item('il-1', '1 Shekel Coin', 'Israel', '🇮🇱', 'coin', 1, 'ILS', ['copper'], { size: 'small' },
    'Copper-nickel 1 shekel.'),
  item('il-20', '20 Shekel Note', 'Israel', '🇮🇱', 'bill', 20, 'ILS', ['green'], {},
    'Green ₪20 note.'),
  item('il-50', '50 Shekel Note', 'Israel', '🇮🇱', 'bill', 50, 'ILS', ['purple'], {},
    'Purple ₪50 note.'),
  item('il-100', '100 Shekel Note', 'Israel', '🇮🇱', 'bill', 100, 'ILS', ['brown'], {},
    'Brown ₪100 note.'),
  item('cz-1', '1 Koruna Coin', 'Czechia', '🇨🇿', 'coin', 1, 'CZK', ['silver'], { size: 'small' },
    'Nickel 1 koruna.'),
  item('cz-100', '100 Koruna Note', 'Czechia', '🇨🇿', 'bill', 100, 'CZK', ['green', 'teal'], {},
    'Green 100 Kč note.'),
  item('cz-200', '200 Koruna Note', 'Czechia', '🇨🇿', 'bill', 200, 'CZK', ['orange'], {},
    'Orange 200 Kč note.'),
  item('cz-500', '500 Koruna Note', 'Czechia', '🇨🇿', 'bill', 500, 'CZK', ['brown'], {},
    'Brown 500 Kč note.'),
  item('hu-10', '10 Forint Coin', 'Hungary', '🇭🇺', 'coin', 10, 'HUF', ['copper'], { size: 'small' },
    'Copper 10 forint.'),
  item('hu-500', '500 Forint Note', 'Hungary', '🇭🇺', 'bill', 500, 'HUF', ['brown'], {},
    'Brown 500 Ft note.'),
  item('hu-1000', '1000 Forint Note', 'Hungary', '🇭🇺', 'bill', 1000, 'HUF', ['blue'], {},
    'Blue 1000 Ft note.'),
  item('hu-2000', '2000 Forint Note', 'Hungary', '🇭🇺', 'bill', 2000, 'HUF', ['brown'], {},
    'Brown 2000 Ft note.'),
  item('ro-1', '1 Leu Coin', 'Romania', '🇷🇴', 'coin', 1, 'RON', ['gold'], { size: 'small' },
    'Brass 1 leu.'),
  item('ro-1n', '1 Leu Note', 'Romania', '🇷🇴', 'bill', 1, 'RON', ['green'], {},
    'Green polymer 1 leu.'),
  item('ro-5', '5 Lei Note', 'Romania', '🇷🇴', 'bill', 5, 'RON', ['purple'], {},
    'Purple polymer 5 lei.'),
  item('ro-10', '10 Lei Note', 'Romania', '🇷🇴', 'bill', 10, 'RON', ['pink'], {},
    'Pink polymer 10 lei.'),
  item('ua-1', '1 Hryvnia Coin', 'Ukraine', '🇺🇦', 'coin', 1, 'UAH', ['yellow'], { size: 'small' },
    'Brass-look 1 hryvnia.'),
  item('ua-20', '20 Hryvnia Note', 'Ukraine', '🇺🇦', 'bill', 20, 'UAH', ['green'], {},
    'Green ₴20 note.'),
  item('ua-50', '50 Hryvnia Note', 'Ukraine', '🇺🇦', 'bill', 50, 'UAH', ['purple'], {},
    'Purple ₴50 note.'),
  item('ua-100', '100 Hryvnia Note', 'Ukraine', '🇺🇦', 'bill', 100, 'UAH', ['green', 'olive'], {},
    'Olive ₴100 note.'),
  item('pk-1', '1 Rupee Coin', 'Pakistan', '🇵🇰', 'coin', 1, 'PKR', ['gold'], { size: 'small' },
    'Brass 1 rupee.'),
  item('pk-10', '10 Rupee Note', 'Pakistan', '🇵🇰', 'bill', 10, 'PKR', ['green'], {},
    'Green Rs10 note.'),
  item('pk-50', '50 Rupee Note', 'Pakistan', '🇵🇰', 'bill', 50, 'PKR', ['purple'], {},
    'Purple Rs50 note.'),
  item('pk-100', '100 Rupee Note', 'Pakistan', '🇵🇰', 'bill', 100, 'PKR', ['red'], {},
    'Red Rs100 note.'),
  item('bd-2', '2 Taka Note', 'Bangladesh', '🇧🇩', 'bill', 2, 'BDT', ['green'], {},
    'Green ৳2 note.'),
  item('bd-10', '10 Taka Note', 'Bangladesh', '🇧🇩', 'bill', 10, 'BDT', ['pink', 'red'], {},
    'Pink ৳10 note.'),
  item('bd-50', '50 Taka Note', 'Bangladesh', '🇧🇩', 'bill', 50, 'BDT', ['orange'], {},
    'Orange ৳50 note.'),
  item('bd-100', '100 Taka Note', 'Bangladesh', '🇧🇩', 'bill', 100, 'BDT', ['blue'], {},
    'Blue ৳100 note.'),
  item('ar-10', '10 Peso Note', 'Argentina', '🇦🇷', 'bill', 10, 'ARS', ['brown'], {},
    'Brown AR$10 note. Face value is tiny in US dollars after recent inflation.'),
  item('ar-20', '20 Peso Note', 'Argentina', '🇦🇷', 'bill', 20, 'ARS', ['red'], {},
    'Red AR$20 note.'),
  item('ar-100', '100 Peso Note', 'Argentina', '🇦🇷', 'bill', 100, 'ARS', ['purple'], {},
    'Violet AR$100 note.'),
  item('ar-1000', '1000 Peso Note', 'Argentina', '🇦🇷', 'bill', 1000, 'ARS', ['green'], {},
    'Green AR$1000 note.'),
  item('cl-10', '10 Peso Coin', 'Chile', '🇨🇱', 'coin', 10, 'CLP', ['gold'], { size: 'small' },
    'Brass 10 pesos.'),
  item('cl-1000', '1000 Peso Note', 'Chile', '🇨🇱', 'bill', 1000, 'CLP', ['green'], {},
    'Green 1000 peso note.'),
  item('cl-2000', '2000 Peso Note', 'Chile', '🇨🇱', 'bill', 2000, 'CLP', ['purple'], {},
    'Purple 2000 peso note.'),
  item('cl-5000', '5000 Peso Note', 'Chile', '🇨🇱', 'bill', 5000, 'CLP', ['red'], {},
    'Red 5000 peso note.'),
  item('co-200', '200 Peso Coin', 'Colombia', '🇨🇴', 'coin', 200, 'COP', ['gold'], { size: 'small' },
    'Brass 200 pesos.'),
  item('co-2000', '2000 Peso Note', 'Colombia', '🇨🇴', 'bill', 2000, 'COP', ['blue'], {},
    'Blue 2000 peso note.'),
  item('co-5000', '5000 Peso Note', 'Colombia', '🇨🇴', 'bill', 5000, 'COP', ['brown'], {},
    'Brown 5000 peso note.'),
  item('co-10000', '10000 Peso Note', 'Colombia', '🇨🇴', 'bill', 10000, 'COP', ['red'], {},
    'Red 10000 peso note.'),
  item('pe-1', '1 Sol Coin', 'Peru', '🇵🇪', 'coin', 1, 'PEN', ['silver'], { size: 'medium' },
    'Nickel 1 sol.'),
  item('pe-10', '10 Sol Note', 'Peru', '🇵🇪', 'bill', 10, 'PEN', ['green'], {},
    'Green S/10 note.'),
  item('pe-20', '20 Sol Note', 'Peru', '🇵🇪', 'bill', 20, 'PEN', ['orange', 'brown'], {},
    'Orange S/20 note.'),
  item('pe-50', '50 Sol Note', 'Peru', '🇵🇪', 'bill', 50, 'PEN', ['orange'], {},
    'Orange S/50 note.'),
];

const SAMPLES = [
  { id: 'penny', label: 'Copper coin', paint: paintCopperCoin },
  { id: 'quarter', label: 'Silver coin', paint: paintSilverCoin },
  { id: 'euro', label: 'Gold coin', paint: paintGoldCoin },
  { id: 'toonie', label: 'Two-tone coin', paint: paintBimetalCoin },
  { id: 'usd', label: 'Green bill', paint: paintGreenBill },
  { id: 'euro50', label: 'Orange bill', paint: paintOrangeBill },
  { id: 'gbp20', label: 'Purple bill', paint: paintPurpleBill },
  { id: 'thb20', label: 'Teal bill', paint: paintTealBill },
];

const gate = document.getElementById('gate');
const cameraScreen = document.getElementById('camera');
const busyScreen = document.getElementById('busy');
const pickScreen = document.getElementById('pick');
const resultScreen = document.getElementById('result');
const catalogScreen = document.getElementById('catalog');
const video = document.getElementById('cam');
const view = document.getElementById('view');
const viewCtx = view.getContext('2d');
const work = document.createElement('canvas');
const workCtx = work.getContext('2d', { willReadFrequently: true });
const preview = document.getElementById('preview');
const shot = document.getElementById('shot');
const pickShot = document.getElementById('pick-shot');
const pickBody = document.getElementById('pick-body');
const camStatus = document.getElementById('cam-status');
const resultCard = document.getElementById('result-card');
const catalogList = document.getElementById('catalog-list');
const catalogSearch = document.getElementById('catalog-search');

let stream = null;
let facing = 'environment';
let lastMatches = [];
let returnTo = 'gate';
let pendingCanvas = null;
let pickKind = null;
let pickCountry = null;
let viewLoop = 0;

function item(id, name, country, flag, kind, amount, currency, colors, extra, note) {
  const usd = amount * FX[currency];
  return {
    id,
    name,
    country,
    flag,
    kind,
    amount,
    currency,
    colors,
    size: extra.size || 'medium',
    bimetal: Boolean(extra.bimetal),
    note,
    face: formatMoney(amount, currency),
    worth: formatMoney(amount, currency),
    sellUsd: formatSellUsd(usd),
    usd,
  };
}

function formatMoney(amount, currency) {
  const row = WORLD_BY_CODE[currency];
  const symbol = row?.symbol || `${currency} `;
  if (row?.whole || currency === 'JPY' || currency === 'KRW') {
    return `${symbol}${Math.round(amount).toLocaleString('en-US')}`.trim();
  }
  if (amount >= 1) {
    const text = amount % 1 ? amount.toFixed(2) : String(amount);
    return `${symbol}${text}`.trim();
  }
  if (currency === 'USD') return `${Math.round(amount * 100)}¢`;
  return `${symbol}${amount.toFixed(2)}`.trim();
}

function formatSellUsd(usd) {
  if (usd < 0.005) return '$0.00';
  return `$${usd.toFixed(2)}`;
}

function formatConverted(usd, row) {
  const amount = usd / row.usd;
  if (row.whole || amount >= 1000) {
    return `${row.symbol}${Math.round(amount).toLocaleString('en-US')}`.trim();
  }
  if (amount >= 1) return `${row.symbol}${amount.toFixed(2)}`.trim();
  if (amount < 0.005 && row.code === 'USD') return 'less than 1¢';
  if (amount < 0.01) return `${row.symbol}${amount.toFixed(4)}`.trim();
  return `${row.symbol}${amount.toFixed(2)}`.trim();
}

function worldValueRows(usd, homeCode) {
  return WORLD.map((row) => {
    const home = row.code === homeCode;
    return `<li class="${home ? 'home' : ''}">
      <span class="wv-flag">${row.flag}</span>
      <span class="wv-name">${row.name}</span>
      <strong>${formatConverted(usd, row)}</strong>
    </li>`;
  }).join('');
}

function show(el) {
  [gate, cameraScreen, busyScreen, pickScreen, resultScreen, catalogScreen].forEach((node) => {
    const on = node === el;
    node.classList.toggle('hidden', !on);
    node.hidden = !on;
  });
}

function countriesFor(kind) {
  const seen = new Map();
  for (const entry of CATALOG) {
    if (entry.kind !== kind || seen.has(entry.country)) continue;
    seen.set(entry.country, entry.flag);
  }
  return [...seen.entries()].map(([country, flag]) => ({ country, flag }));
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s: s * 100, l: l * 100 };
}

function colorScores(h, s, l) {
  const scores = {
    copper: 0,
    brown: 0,
    silver: 0,
    gold: 0,
    green: 0,
    blue: 0,
    red: 0,
    orange: 0,
    purple: 0,
    teal: 0,
    pink: 0,
    yellow: 0,
    gray: 0,
    olive: 0,
  };
  if (s < 10 && l > 50 && l < 82) {
    scores.silver = 0.45;
    scores.gray = 0.4;
  }
  if (s < 14 && l >= 30 && l <= 70) scores.gray = Math.max(scores.gray, 0.55);
  if (h >= 15 && h <= 40 && s > 28 && l > 22 && l < 70) {
    scores.copper = 0.9;
    scores.brown = 0.55;
  }
  if (h >= 18 && h <= 45 && s > 18 && l < 40) scores.brown = Math.max(scores.brown, 0.75);
  if (h >= 36 && h <= 58 && s > 32 && l > 28 && l < 78) scores.gold = 0.9;
  if (h >= 48 && h <= 68 && s > 40 && l > 40) scores.yellow = 0.85;
  if (h >= 70 && h <= 100 && s > 20) scores.olive = 0.7;
  if (h >= 90 && h <= 155 && s > 18) scores.green = 0.88;
  if (h >= 160 && h <= 195 && s > 20) scores.teal = 0.85;
  if (h >= 190 && h <= 250 && s > 20) scores.blue = 0.88;
  if (h >= 250 && h <= 310 && s > 18) scores.purple = 0.86;
  if ((h <= 12 || h >= 345) && s > 30) scores.red = 0.88;
  if (h >= 12 && h <= 36 && s > 40 && l > 35) scores.orange = 0.86;
  if (h >= 310 && h <= 345 && s > 18) scores.pink = 0.8;
  return scores;
}

function analyze(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  const sample = (x, y) => {
    const i = (Math.floor(y) * w + Math.floor(x)) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  };
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.32;
  const inner = radius * 0.72;
  const corners = [];
  for (const [x, y] of [[8, 8], [w - 9, 8], [8, h - 9], [w - 9, h - 9], [cx, 8], [cx, h - 9], [8, cy], [w - 9, cy]]) {
    corners.push(sample(x, y));
  }
  const bg = {
    r: corners.reduce((n, p) => n + p.r, 0) / corners.length,
    g: corners.reduce((n, p) => n + p.g, 0) / corners.length,
    b: corners.reduce((n, p) => n + p.b, 0) / corners.length,
  };
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let count = 0;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  const hues = [];
  const sats = [];
  const step = Math.max(2, Math.floor(Math.min(w, h) / 90));
  for (let y = cy - radius; y <= cy + radius; y += step) {
    for (let x = cx - radius; x <= cx + radius; x += step) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > radius * radius) continue;
      const p = sample(x, y);
      const dist = Math.abs(p.r - bg.r) + Math.abs(p.g - bg.g) + Math.abs(p.b - bg.b);
      const hsl = rgbToHsl(p.r, p.g, p.b);
      const inCore = dx * dx + dy * dy < inner * inner;
      if (dist < 55 && !inCore) continue;
      count += 1;
      rSum += p.r;
      gSum += p.g;
      bSum += p.b;
      hues.push(hsl.h);
      sats.push(hsl.s);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (count < 8) {
    const mid = sample(cx, cy);
    rSum = mid.r;
    gSum = mid.g;
    bSum = mid.b;
    count = 1;
    minX = cx - inner;
    minY = cy - inner * 0.55;
    maxX = cx + inner;
    maxY = cy + inner * 0.55;
    const midHsl = rgbToHsl(mid.r, mid.g, mid.b);
    hues.push(midHsl.h);
    sats.push(midHsl.s);
  }
  const avg = { r: rSum / count, g: gSum / count, b: bSum / count };
  const hsl = rgbToHsl(avg.r, avg.g, avg.b);
  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);
  const aspect = boxW / boxH;
  const boxArea = boxW * boxH;
  const fill = (count * step * step) / boxArea;
  const circularity = Math.min(aspect, 1 / aspect) * Math.min(1, fill * 1.35);
  const colors = colorScores(hsl.h, hsl.s, hsl.l);
  const paper =
    colors.green + colors.blue + colors.red + colors.purple + colors.teal +
    colors.orange + colors.pink + colors.yellow;
  const metallic = colors.silver + colors.copper + colors.gold + colors.gray;
  const avgSat = sats.reduce((n, v) => n + v, 0) / sats.length;
  let kindHint = 'coin';
  if (aspect > 1.38 || aspect < 0.72) kindHint = 'bill';
  else if (paper > 0.7 && paper >= metallic && avgSat > 18) kindHint = 'bill';
  else if (circularity > 0.72 && metallic > paper) kindHint = 'coin';
  const areaRatio = boxArea / (w * h);
  const size = areaRatio < 0.16 ? 'small' : areaRatio > 0.38 ? 'large' : 'medium';
  hues.sort((a, b) => a - b);
  const hueSpread = hues.length ? Math.min(180, hues[hues.length - 1] - hues[0]) : 0;
  const bimetal = hueSpread > 55 && hsl.s > 18 ? 0.85 : 0;
  return {
    kindHint,
    aspect,
    circularity,
    size,
    bimetal,
    paper,
    metallic,
    ...colors,
    h: hsl.h,
    s: hsl.s,
    l: hsl.l,
  };
}

function scoreItem(entry, features) {
  let score = 0;
  if (entry.kind === features.kindHint) score += 34;
  else score -= 22;
  for (const color of entry.colors) {
    score += (features[color] || 0) * 28;
  }
  if (entry.bimetal) score += features.bimetal * 22;
  else score -= features.bimetal * 10;
  if (entry.kind === 'coin') {
    score += features.circularity * 16;
    if (entry.size === features.size) score += 7;
    if (features.metallic > features.paper) score += 10;
    if (features.paper > features.metallic) score -= 30;
    if (entry.id === 'us-half' && (features.paper > 0.4 || features.kindHint === 'bill')) score -= 40;
  } else {
    score += Math.min(features.aspect, 2.4) > 1.3 ? 12 : 0;
    if (features.paper >= features.metallic) score += 18;
    if (features.kindHint === 'bill') score += 20;
  }
  return score;
}

function identify(canvas, forced = {}) {
  const features = analyze(canvas);
  if (forced.kind) features.kindHint = forced.kind;
  const pool = CATALOG.filter((entry) => {
    if (forced.kind && entry.kind !== forced.kind) return false;
    if (forced.country && entry.country !== forced.country) return false;
    return true;
  });
  const ranked = pool
    .map((entry) => ({ entry, score: scoreItem(entry, features) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length) return [];
  if (forced.kind && forced.country) return ranked.map((row) => row.entry);
  const best = ranked[0];
  return ranked
    .filter((row) => row.entry.kind === best.entry.kind)
    .slice(0, 6)
    .map((row) => row.entry);
}

function drawCover(ctx, source, dw, dh) {
  const sw = source.videoWidth || source.width;
  const sh = source.videoHeight || source.height;
  if (!sw || !sh) return;
  const scale = Math.max(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  ctx.drawImage(source, (dw - w) / 2, (dh - h) / 2, w, h);
}

function drawSourceTo(canvas, source) {
  const ctx = canvas.getContext('2d');
  const size = 360;
  canvas.width = size;
  canvas.height = size;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  drawCover(ctx, source, size, size);
}

function isSkinTone(h, s, l) {
  const warm = h <= 32 || h >= 348;
  return warm && s >= 10 && s <= 56 && l >= 20 && l <= 84;
}

function isMoneyTone(h, s, l) {
  if (isSkinTone(h, s, l)) return false;
  const silver = s < 20 && l > 32 && l < 90;
  const copper = h >= 14 && h <= 40 && s > 24 && l > 16 && l < 70;
  const gold = h >= 36 && h <= 58 && s > 26 && l > 26 && l < 82;
  const paper =
    s > 14 &&
    l > 10 &&
    l < 90 &&
    ((h >= 70 && h <= 175) ||
      (h >= 175 && h <= 260) ||
      (h >= 260 && h <= 330) ||
      h <= 16 ||
      h >= 345 ||
      (h >= 16 && h <= 45 && s > 32) ||
      (h >= 45 && h <= 70 && s > 30));
  return silver || copper || gold || paper;
}

function isolateMoneyOn(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const keep = new Uint8Array(w * h);
  const boxL = Math.floor(w * 0.11);
  const boxR = Math.ceil(w * 0.89);
  const boxT = Math.floor(h * 0.26);
  const boxB = Math.ceil(h * 0.74);
  const bg = { r: 0, g: 0, b: 0 };
  let bgN = 0;
  const addBg = (x, y) => {
    const i = (y * w + x) * 4;
    bg.r += data[i];
    bg.g += data[i + 1];
    bg.b += data[i + 2];
    bgN += 1;
  };
  for (let x = 0; x < w; x += 6) {
    addBg(x, 2);
    addBg(x, h - 3);
  }
  for (let y = 0; y < h; y += 6) {
    addBg(2, y);
    addBg(w - 3, y);
  }
  bg.r /= bgN;
  bg.g /= bgN;
  bg.b /= bgN;
  for (let y = boxT; y < boxB; y += 1) {
    for (let x = boxL; x < boxR; x += 1) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const hsl = rgbToHsl(r, g, b);
      const dist = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b);
      if (isSkinTone(hsl.h, hsl.s, hsl.l)) continue;
      if (dist < 48 && hsl.s < 16) continue;
      if (isMoneyTone(hsl.h, hsl.s, hsl.l) || dist > 90) keep[y * w + x] = 1;
    }
  }
  const seen = new Uint8Array(w * h);
  const qx = new Int32Array(w * h);
  const qy = new Int32Array(w * h);
  let qh = 0;
  let qt = 0;
  const seed = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (!keep[idx] || seen[idx]) return;
    seen[idx] = 1;
    qx[qt] = x;
    qy[qt] = y;
    qt += 1;
  };
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  for (let r = 0; r < Math.floor(Math.min(w, h) / 4); r += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      seed(cx - r, cy + dy);
      seed(cx + r, cy + dy);
      seed(cx + dy, cy - r);
      seed(cx + dy, cy + r);
    }
    if (qt) break;
  }
  while (qh < qt) {
    const x = qx[qh];
    const y = qy[qh];
    qh += 1;
    seed(x - 1, y);
    seed(x + 1, y);
    seed(x, y - 1);
    seed(x, y + 1);
  }
  const useBlob = qt > 40;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = y * w + x;
      const stay = useBlob ? seen[idx] : keep[idx];
      if (stay) continue;
      const i = idx * 4;
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function paintViewFrame() {
  if (!stream || cameraScreen.hidden) {
    viewLoop = 0;
    return;
  }
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (vw) {
    const dw = Math.min(480, window.innerWidth);
    const dh = Math.round((dw * window.innerHeight) / Math.max(1, window.innerWidth));
    work.width = dw;
    work.height = dh;
    view.width = dw;
    view.height = dh;
    workCtx.fillStyle = '#000';
    workCtx.fillRect(0, 0, dw, dh);
    drawCover(workCtx, video, dw, dh);
    isolateMoneyOn(work);
    viewCtx.fillStyle = '#000';
    viewCtx.fillRect(0, 0, dw, dh);
    viewCtx.drawImage(work, 0, 0);
  }
  viewLoop = requestAnimationFrame(paintViewFrame);
}

function paintTable(ctx, w, h) {
  ctx.fillStyle = '#4a3b2a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#3a2d20';
  for (let i = 0; i < 12; i += 1) {
    ctx.fillRect(i * 40, 0, 18, h);
  }
}

function paintCopperCoin(ctx, w, h) {
  paintTable(ctx, w, h);
  const g = ctx.createRadialGradient(w * 0.45, h * 0.42, 16, w / 2, h / 2, w * 0.28);
  g.addColorStop(0, '#e0a36a');
  g.addColorStop(1, '#8a4b22');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.26, 0, Math.PI * 2);
  ctx.fill();
}

function paintSilverCoin(ctx, w, h) {
  paintTable(ctx, w, h);
  const g = ctx.createRadialGradient(w * 0.42, h * 0.4, 12, w / 2, h / 2, w * 0.3);
  g.addColorStop(0, '#f2f2f0');
  g.addColorStop(1, '#8d9196');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function paintGoldCoin(ctx, w, h) {
  paintTable(ctx, w, h);
  const g = ctx.createRadialGradient(w * 0.44, h * 0.4, 10, w / 2, h / 2, w * 0.27);
  g.addColorStop(0, '#f6d56b');
  g.addColorStop(1, '#b8860b');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.27, 0, Math.PI * 2);
  ctx.fill();
}

function paintBimetalCoin(ctx, w, h) {
  paintTable(ctx, w, h);
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cfd4da';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.17, 0, Math.PI * 2);
  ctx.fill();
}

function paintBill(ctx, w, h, a, b) {
  ctx.fillStyle = '#2c241c';
  ctx.fillRect(0, 0, w, h);
  const grd = ctx.createLinearGradient(40, 80, w - 40, h - 80);
  grd.addColorStop(0, a);
  grd.addColorStop(1, b);
  ctx.fillStyle = grd;
  ctx.fillRect(36, 110, w - 72, h - 220);
}

function paintGreenBill(ctx, w, h) {
  paintBill(ctx, w, h, '#1f6b4a', '#7d9a74');
}

function paintOrangeBill(ctx, w, h) {
  paintBill(ctx, w, h, '#e07a2f', '#f0b27a');
}

function paintPurpleBill(ctx, w, h) {
  paintBill(ctx, w, h, '#6b3fa0', '#b388eb');
}

function paintTealBill(ctx, w, h) {
  paintBill(ctx, w, h, '#1b7a62', '#7dcec3');
}

function sampleCanvas(paint) {
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 360;
  paint(canvas.getContext('2d'), 360, 360);
  return canvas;
}

function copyCanvas(from, to) {
  to.width = from.width;
  to.height = from.height;
  to.getContext('2d').drawImage(from, 0, 0);
}

function renderResult(matches, pickId, hasPhoto = true) {
  lastMatches = matches;
  document.querySelector('.result-shot')?.classList.toggle('hidden', !hasPhoto);
  const pick = matches.find((row) => row.id === pickId) || matches[0];
  const alts = matches.filter((row) => row.id !== pick.id).slice(0, 3);
  resultCard.innerHTML = `
    <div class="flag-row">
      <span>${pick.flag}</span>
      <em class="kind">${pick.kind === 'coin' ? 'COIN' : 'BILL'}</em>
    </div>
    <p class="id-label">Identified country</p>
    <h2>${pick.country}</h2>
    <p class="country">${pick.name} · printed ${pick.face}</p>
    <p class="id-label">Sell price in USA</p>
    <p class="worth">${pick.sellUsd}</p>
    <p class="face">What a US exchange would pay for this ${pick.kind}.</p>
    <p class="alt-label">Same amount in other countries</p>
    <ul class="world-values">${worldValueRows(pick.usd, pick.currency)}</ul>
    <p class="note">${pick.note}</p>
    ${alts.length ? `<p class="alt-label">Wrong piece? Tap the real one</p><div class="alts">${alts.map((row) =>
      `<button type="button" data-alt="${row.id}">${row.flag} ${row.name} · USA ${row.sellUsd}</button>`).join('')}</div>` : ''}
  `;
}

function startFromPhoto(sourceCanvas) {
  isolateMoneyOn(sourceCanvas);
  pendingCanvas = sourceCanvas;
  pickKind = null;
  pickCountry = null;
  copyCanvas(sourceCanvas, preview);
  copyCanvas(sourceCanvas, shot);
  copyCanvas(sourceCanvas, pickShot);
  showPickKind();
}

function showPickKind() {
  pickBody.innerHTML = `
    <h2>What did you scan?</h2>
    <div class="pick-row">
      <button type="button" data-kind="bill">It's a bill / cash</button>
      <button type="button" data-kind="coin">It's a coin</button>
    </div>
    <button class="ghost" type="button" data-pick-back="photo">Back</button>
  `;
  show(pickScreen);
}

function showPickCountry() {
  const rows = countriesFor(pickKind);
  pickBody.innerHTML = `
    <h2>${pickKind === 'bill' ? "Which country's cash?" : "Which country's coin?"}</h2>
    <input id="pick-search" type="search" placeholder="Search country" aria-label="Search country">
    <div id="country-grid" class="country-grid">${countryButtons(rows)}</div>
    <button class="ghost" type="button" data-pick-back="kind">Back</button>
  `;
  show(pickScreen);
}

function countryButtons(rows) {
  return rows
    .map((row) => `<button type="button" data-country="${row.country}">${row.flag} ${row.country}</button>`)
    .join('');
}

function showPickItems() {
  const matches = identify(pendingCanvas, { kind: pickKind, country: pickCountry });
  pickBody.innerHTML = `
    <h2>Tap the exact ${pickKind === 'bill' ? 'bill' : 'coin'}</h2>
    <div class="pick-items">${matches.map((entry) =>
      `<button type="button" data-id="${entry.id}"><strong>${entry.flag} ${entry.name}</strong><small>${entry.face} · USA sell ${entry.sellUsd}</small></button>`
    ).join('')}</div>
    <button class="ghost" type="button" data-pick-back="country">Back</button>
  `;
  show(pickScreen);
}

function finishPickedItem(entry) {
  const siblings = CATALOG.filter((row) => row.kind === entry.kind && row.country === entry.country);
  lastMatches = [entry, ...siblings.filter((row) => row.id !== entry.id)];
  renderResult(lastMatches, entry.id, true);
  show(resultScreen);
}

async function runIdentify(sourceCanvas, forced = {}) {
  copyCanvas(sourceCanvas, preview);
  copyCanvas(sourceCanvas, shot);
  show(busyScreen);
  await new Promise((resolve) => setTimeout(resolve, 400));
  const matches = identify(sourceCanvas, forced);
  renderResult(matches);
  show(resultScreen);
}

async function startCamera() {
  stopCamera();
  camStatus.textContent = 'Starting camera…';
  show(cameraScreen);
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    video.srcObject = stream;
    await video.play();
    camStatus.textContent = 'Put a coin or bill in the box. Hands and the room stay black.';
    if (!viewLoop) viewLoop = requestAnimationFrame(paintViewFrame);
  } catch (err) {
    camStatus.textContent = 'Camera blocked. Pick a photo or try a sample instead.';
  }
}

function stopCamera() {
  if (viewLoop) cancelAnimationFrame(viewLoop);
  viewLoop = 0;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  video.srcObject = null;
  viewCtx.fillStyle = '#000';
  viewCtx.fillRect(0, 0, view.width || 1, view.height || 1);
}

function snapFromVideo() {
  if (!video.videoWidth) {
    camStatus.textContent = 'Camera is not ready yet.';
    return;
  }
  const canvas = document.createElement('canvas');
  drawSourceTo(canvas, video);
  stopCamera();
  startFromPhoto(canvas);
}

function openCatalog(from) {
  returnTo = from;
  renderCatalog(catalogSearch.value);
  show(catalogScreen);
}

function renderCatalog(query) {
  const q = String(query || '').trim().toLowerCase();
  const rows = CATALOG.filter((entry) =>
    !q || `${entry.name} ${entry.country} ${entry.face}`.toLowerCase().includes(q)
  );
  catalogList.innerHTML = rows.map((entry) => `
    <button class="catalog-item" type="button" data-id="${entry.id}">
      <strong>${entry.flag} ${entry.name}</strong>
      <span class="catalog-meta">${entry.country} · ${entry.face} · USA sell ${entry.sellUsd}</span>
    </button>
  `).join('') || '<p class="note">Nothing matches that search.</p>';
}

function closeCatalog() {
  if (lastMatches.length && returnTo === 'result') {
    show(resultScreen);
    return;
  }
  show(gate);
}

document.getElementById('sample-row').innerHTML = SAMPLES.map((sample) =>
  `<button type="button" data-sample="${sample.id}">${sample.label}</button>`
).join('');

document.getElementById('open-cam').addEventListener('click', startCamera);
document.getElementById('cam-cancel').addEventListener('click', () => {
  stopCamera();
  show(gate);
});
document.getElementById('cam-flip').addEventListener('click', () => {
  facing = facing === 'environment' ? 'user' : 'environment';
  startCamera();
});
document.getElementById('shutter').addEventListener('click', snapFromVideo);
document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    drawSourceTo(canvas, image);
    URL.revokeObjectURL(image.src);
    startFromPhoto(canvas);
  };
  image.src = URL.createObjectURL(file);
});
document.getElementById('sample-row').addEventListener('click', (event) => {
  const id = event.target.closest('[data-sample]')?.dataset.sample;
  const sample = SAMPLES.find((row) => row.id === id);
  if (!sample) return;
  startFromPhoto(sampleCanvas(sample.paint));
});
pickBody.addEventListener('click', (event) => {
  const kind = event.target.closest('[data-kind]')?.dataset.kind;
  if (kind) {
    pickKind = kind;
    showPickCountry();
    return;
  }
  const country = event.target.closest('[data-country]')?.dataset.country;
  if (country) {
    pickCountry = country;
    showPickItems();
    return;
  }
  const id = event.target.closest('[data-id]')?.dataset.id;
  const entry = CATALOG.find((row) => row.id === id);
  if (entry) {
    finishPickedItem(entry);
    return;
  }
  const back = event.target.closest('[data-pick-back]')?.dataset.pickBack;
  if (back === 'photo') {
    pendingCanvas = null;
    show(gate);
    return;
  }
  if (back === 'kind') {
    showPickKind();
    return;
  }
  if (back === 'country') showPickCountry();
});
pickBody.addEventListener('input', (event) => {
  if (event.target.id !== 'pick-search') return;
  const q = String(event.target.value || '').trim().toLowerCase();
  const rows = countriesFor(pickKind).filter((row) => row.country.toLowerCase().includes(q));
  document.getElementById('country-grid').innerHTML = countryButtons(rows);
});
document.getElementById('scan-again').addEventListener('click', () => {
  lastMatches = [];
  startCamera();
});
document.getElementById('browse-btn').addEventListener('click', () => openCatalog('gate'));
document.getElementById('result-browse').addEventListener('click', () => {
  returnTo = 'result';
  openCatalog('result');
});
document.getElementById('catalog-back').addEventListener('click', closeCatalog);
catalogSearch.addEventListener('input', () => renderCatalog(catalogSearch.value));
catalogList.addEventListener('click', (event) => {
  const id = event.target.closest('[data-id]')?.dataset.id;
  const entry = CATALOG.find((row) => row.id === id);
  if (!entry) return;
  renderResult([entry], entry.id, false);
  lastMatches = [entry];
  show(resultScreen);
});
resultCard.addEventListener('click', (event) => {
  const id = event.target.closest('[data-alt]')?.dataset.alt;
  if (!id) return;
  renderResult(lastMatches, id);
});
