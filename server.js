const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJwtController = require('./auth_jwt'); // You're not using authController, consider removing it
const jwt = require('jsonwebtoken');
const cors = require('cors');
const geoip = require('geoip-country');
const User = require('./Users');
const Order = require('./Orders'); 
const Country = require('./Countries'); 
const Item = require('./Items');
const { default: mongoose } = require('mongoose');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

const router = express.Router();

// Removed getJSONObjectForMovieRequirement as it's not used

router.post('/signup', async (req, res) => { // Use async/await
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ success: false, msg: 'Please include both username and password to signup.' }); // 400 Bad Request
  }

  try {
    const user = new User({ // Create user directly with the data
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
    });

    await user.save(); // Use await with user.save()

    res.status(201).json({ success: true, msg: 'Successfully created new user.' }); // 201 Created
  } catch (err) {
    if (err.code === 11000) { // Strict equality check (===)
      return res.status(409).json({ success: false, message: 'A user with that username already exists.' }); // 409 Conflict
    } else {
      console.error(err); // Log the error for debugging
      return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
    }
  }
});


router.post('/signin', async (req, res) => { // Use async/await
  try {
    const user = await User.findOne({ username: req.body.username }).select('name username password');

    if (!user) {
      return res.status(401).json({ success: false, msg: 'Authentication failed. User not found.' }); // 401 Unauthorized
    }

    const isMatch = await user.comparePassword(req.body.password); // Use await

    if (isMatch) {
      const userToken = { id: user._id, username: user.username }; // Use user._id (standard Mongoose)
      const token = jwt.sign(userToken, process.env.SECRET_KEY, { expiresIn: '1h' }); // Add expiry to the token (e.g., 1 hour)
      res.status(200).json({ 
        success: true, 
        token: 'JWT ' + token,
        id: user._id });
    } else {
      res.status(401).json({ success: false, msg: 'Authentication failed. Incorrect password.' }); // 401 Unauthorized
    }
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
  }
});

router.route('/orders')
  .get(authJwtController.isAuthenticated, async (req, res) => {
    // if (req.body.privledge != 'Admin')
    // {
    //   var msg = 'UnAuthorized!';
    //   console.log(msg);
    //   return res.status(404).json({ success: false, message: msg });
    // }
    const orders = await Order.find();    // Get All Orders
    return res.status(200).json(orders);
  })
  .post(authJwtController.isAuthenticated, async (req, res) => {
    const body = req.body;
    var error = '';
    var obj = {
      userid: body.userid,
      deny: body.deny,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      items: body.items,
      total: body.total
    };
    for (const key in obj)
    {
      const value = obj[key];
      if ((!value && value!=false) || String(value).trim()=='')
        error += 'Order needs a ' +key+ '! ';
    }
    // Items
    let items = [];
    if(body.items.length==0)
      error += 'There are no items! ';
    else
      for(var i=0; i<body.items.length; i++)
    {
      var itm = body.items[i];
      if (!itm.itemname || String(itm.itemname).trim()=='')
        error += 'Item[' +i+ '] has no itemname! ';
      if (!itm.price || String(itm.price).trim()=='')
        error += 'Item[' +i+ '] has no price! ';
      items.push({itemname: itm.itemname, price: itm.price});
    }
    obj.userid = new mongoose.Types.ObjectId(obj.userid);
    obj.items = items;
    obj.msg = (body.msg) ? body.msg : '';
    obj.date = new Date().toISOString();
    //
    if (error != '')
      return res.status(500).json({ success: false, message: error });
    const order = new Order(obj);
    try {
      await order.save();
    } catch (err) {
      if (err.code === 11000) { // Strict equality check (===)
        return res.status(409).json({ success: false, message: 'A order with that name already exists.' }); // 409 Conflict
      } else {
        console.error(err); // Log the error for debugging
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
      }
    }
    return res.status(201).json({...order, success: true });
  })
  .all((req, res) => {
    // Any other HTTP Method
    // Returns a message stating that the HTTP method is unsupported.
    res.status(405).send({ message: 'HTTP method not supported.' });
  });

router.route('/orders/:orderId')
  .get(authJwtController.isAuthenticated, async (req, res) => {
    const id = req.params.orderId;
    var order = await Order.findById(id);
    if (!order)
      return res.status(404).json({success: false, message: 'Unable to find order.'});
    order = JSON.parse(JSON.stringify(order))
    return res.status(200).json({...order, success: true});
  })
  .put(authJwtController.isAuthenticated, async (req, res) => {
    let keys = 'deny address city state zip items total msg date'.split(' ');
    var obj = {};
    for (const k of keys)
      if (req.body[k] || req.body[k]===false)
        obj[k] = req.body[k];
    if (Object.keys(obj).length == 0)
      return res.status(404).json({success: false, message: 'There is nothing to Update!'});
    const id = req.params.orderId;
    try {
      var o = await Order.findByIdAndUpdate(id, obj);
    } catch {
      o = false;
    }
    if (!o)
      return res.status(404).json({success: false, message: 'Unable to Update Order.'});
    return res.status(200).json({success: true, message: 'Updated Order.'});
  })
  .delete(authJwtController.isAuthenticated, async (req, res) => {
    const id = req.params.orderId;
    try {
      var o = await Order.findByIdAndDelete(id);
    } catch {
      o = false;
    }
    if (!o)
      return res.status(404).json({success: false, message: 'Unable to Delete order.'});
    return res.status(200).json({success: true, message: 'Deleted Order.'});
  })
  .all((req, res) => {
    // Any other HTTP Method
    // Returns a message stating that the HTTP method is unsupported.
    res.status(405).send({ message: 'HTTP method not supported.' });
  });

  router.route('/items')
  .get(authJwtController.isAuthenticated, async (req, res) => {
    // if (req.body.privledge != 'Admin')
    // {
    //   var msg = 'UnAuthorized!';
    //   console.log(msg);
    //   return res.status(404).json({ success: false, message: msg });
    // }
    const items = await Item.find();    // Get All Orders
    return res.status(200).json(items);
  })
  .post(authJwtController.isAuthenticated, async (req, res) => {
    const body = req.body;
    var error = '';
    let keys = 'name price imgurl'.split(' ');
    var obj = {};
    for (const k of keys)
    {
      var val = body[k];
      if ((!val && val!=false) || String(val).trim() == '')
        error += 'There needs to be a "' +k+ '"!\n';
      else 
        obj[k] = val;
    }
    //
    if (error != '')
      return res.status(500).json({ success: false, message: error });
    const item = new Item(obj);
    try {
      await item.save();
    } catch (err) {
      if (err.code === 11000) { // Strict equality check (===)
        return res.status(409).json({ success: false, message: 'A item with that name already exists.' }); // 409 Conflict
      } else {
        console.error(err); // Log the error for debugging
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
      }
    }
    return res.status(201).json({...item, success: true });
  })
  .all((req, res) => {
    // Any other HTTP Method
    // Returns a message stating that the HTTP method is unsupported.
    res.status(405).send({ message: 'HTTP method not supported.' });
  });

  router.route('/items/:itemId')
  .get(authJwtController.isAuthenticated, async (req, res) => {
    const id = req.params.itemId;
    var item = await Item.findById(id);
    if (!item)
      return res.status(404).json({success: false, message: 'Unable to find item.'});
    item = JSON.parse(JSON.stringify(item))
    return res.status(200).json({...item, success: true});
  })
  .put(authJwtController.isAuthenticated, async (req, res) => {
    let keys = 'name price imgurl'.split(' ');
    var obj = {};
    for (const k of keys)
      if (req.body[k] || req.body[k]===false)
        obj[k] = req.body[k];
    if (Object.keys(obj).length == 0)
      return res.status(404).json({success: false, message: 'There is nothing to Update!'});
    const id = req.params.itemId;
    try {
      var it = await Item.findByIdAndUpdate(id, obj);
    } catch {
      it = false;
    }
    if (!it)
      return res.status(404).json({success: false, message: 'Unable to Update Item.'});
    return res.status(200).json({success: true, message: 'Updated Item.'});
  })
  .delete(authJwtController.isAuthenticated, async (req, res) => {
    const id = req.params.itemId;
    try {
      var it = await Item.findByIdAndDelete(id);
    } catch {
      it = false;
    }
    if (!it)
      return res.status(404).json({success: false, message: 'Unable to Delete Item.'});
    return res.status(200).json({success: true, message: 'Deleted Item.'});
  })
  .all((req, res) => {
    // Any other HTTP Method
    // Returns a message stating that the HTTP method is unsupported.
    res.status(405).send({ message: 'HTTP method not supported.' });
  });

const countryCodes = {
  'AF': 'Afghanistan',
  'AX': 'Åland Islands',
  'AL': 'Albania',
  'DZ': 'Algeria',
  'AS': 'American Samoa',
  'AD': 'Andorra',
  'AO': 'Angola',
  'AI': 'Anguilla',
  'AQ': 'Antarctica',
  'AG': 'Antigua and Barbuda',
  'AR': 'Argentina',
  'AM': 'Armenia',
  'AW': 'Aruba',
  'AU': 'Australia',
  'AT': 'Austria',
  'AZ': 'Azerbaijan',
  'BS': 'Bahamas',
  'BH': 'Bahrain',
  'BD': 'Bangladesh',
  'BB': 'Barbados',
  'BY': 'Belarus',
  'BE': 'Belgium',
  'BZ': 'Belize',
  'BJ': 'Benin',
  'BM': 'Bermuda',
  'BT': 'Bhutan',
  'BO': 'Bolivia',
  'BA': 'Bosnia and Herzegovina',
  'BW': 'Botswana',
  'BR': 'Brazil',
  'IO': 'British Indian Ocean Territory',
  'BN': 'Brunei Darussalam',
  'BG': 'Bulgaria',
  'BF': 'Burkina Faso',
  'BI': 'Burundi',
  'KH': 'Cambodia',
  'CM': 'Cameroon',
  'CA': 'Canada',
  'CV': 'Cabo Verde',
  'KY': 'Cayman Islands',
  'CF': 'Central African Republic',
  'TD': 'Chad',
  'CL': 'Chile',
  'CN': 'China',
  'CO': 'Colombia',
  'KM': 'Comoros',
  'CG': 'Congo',
  'CD': 'Congo, Democratic Republic of the',
  'CR': 'Costa Rica',
  'CI': "Côte d'Ivoire",
  'HR': 'Croatia',
  'CU': 'Cuba',
  'CY': 'Cyprus',
  'CZ': 'Czechia',
  'DK': 'Denmark',
  'DJ': 'Djibouti',
  'DM': 'Dominica',
  'DO': 'Dominican Republic',
  'EC': 'Ecuador',
  'EG': 'Egypt',
  'SV': 'El Salvador',
  'GQ': 'Equatorial Guinea',
  'ER': 'Eritrea',
  'EE': 'Estonia',
  'SZ': 'Eswatini',
  'ET': 'Ethiopia',
  'FJ': 'Fiji',
  'FI': 'Finland',
  'FR': 'France',
  'GA': 'Gabon',
  'GM': 'Gambia',
  'GE': 'Georgia',
  'DE': 'Germany',
  'GH': 'Ghana',
  'GR': 'Greece',
  'GD': 'Grenada',
  'GT': 'Guatemala',
  'GN': 'Guinea',
  'GW': 'Guinea-Bissau',
  'GY': 'Guyana',
  'HT': 'Haiti',
  'HN': 'Honduras',
  'HU': 'Hungary',
  'IS': 'Iceland',
  'IN': 'India',
  'ID': 'Indonesia',
  'IR': 'Iran',
  'IQ': 'Iraq',
  'IE': 'Ireland',
  'IL': 'Israel',
  'IT': 'Italy',
  'JM': 'Jamaica',
  'JP': 'Japan',
  'JO': 'Jordan',
  'KZ': 'Kazakhstan',
  'KE': 'Kenya',
  'KI': 'Kiribati',
  'KP': "Korea, Democratic People's Republic of",
  'KR': 'Korea, Republic of',
  'KW': 'Kuwait',
  'KG': 'Kyrgyzstan',
  'LA': "Lao People's Democratic Republic",
  'LV': 'Latvia',
  'LB': 'Lebanon',
  'LS': 'Lesotho',
  'LR': 'Liberia',
  'LY': 'Libya',
  'LI': 'Liechtenstein',
  'LT': 'Lithuania',
  'LU': 'Luxembourg',
  'MG': 'Madagascar',
  'MW': 'Malawi',
  'MY': 'Malaysia',
  'MV': 'Maldives',
  'ML': 'Mali',
  'MT': 'Malta',
  'MH': 'Marshall Islands',
  'MR': 'Mauritania',
  'MU': 'Mauritius',
  'MX': 'Mexico',
  'FM': 'Micronesia',
  'MD': 'Moldova',
  'MC': 'Monaco',
  'MN': 'Mongolia',
  'ME': 'Montenegro',
  'MA': 'Morocco',
  'MZ': 'Mozambique',
  'MM': 'Myanmar',
  'NA': 'Namibia',
  'NR': 'Nauru',
  'NP': 'Nepal',
  'NL': 'Netherlands',
  'NZ': 'New Zealand',
  'NI': 'Nicaragua',
  'NE': 'Niger',
  'NG': 'Nigeria',
  'NO': 'Norway',
  'OM': 'Oman',
  'PK': 'Pakistan',
  'PW': 'Palau',
  'PA': 'Panama',
  'PG': 'Papua New Guinea',
  'PY': 'Paraguay',
  'PE': 'Peru',
  'PH': 'Philippines',
  'PL': 'Poland',
  'PT': 'Portugal',
  'QA': 'Qatar',
  'RO': 'Romania',
  'RU': 'Russia',
  'RW': 'Rwanda',
  'KN': 'Saint Kitts and Nevis',
  'LC': 'Saint Lucia',
  'VC': 'Saint Vincent and the Grenadines',
  'WS': 'Samoa',
  'SM': 'San Marino',
  'ST': 'Sao Tome and Principe',
  'SA': 'Saudi Arabia',
  'SN': 'Senegal',
  'RS': 'Serbia',
  'SC': 'Seychelles',
  'SL': 'Sierra Leone',
  'SG': 'Singapore',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'SB': 'Solomon Islands',
  'SO': 'Somalia',
  'ZA': 'South Africa',
  'SS': 'South Sudan',
  'ES': 'Spain',
  'LK': 'Sri Lanka',
  'SD': 'Sudan',
  'SR': 'Suriname',
  'SE': 'Sweden',
  'CH': 'Switzerland',
  'SY': 'Syria',
  'TW': 'Taiwan',
  'TJ': 'Tajikistan',
  'TZ': 'Tanzania',
  'TH': 'Thailand',
  'TL': 'Timor-Leste',
  'TG': 'Togo',
  'TO': 'Tonga',
  'TT': 'Trinidad and Tobago',
  'TN': 'Tunisia',
  'TR': 'Turkey',
  'TM': 'Turkmenistan',
  'TV': 'Tuvalu',
  'UG': 'Uganda',
  'UA': 'Ukraine',
  'AE': 'United Arab Emirates',
  'GB': 'United Kingdom',
  'US': 'United States',
  'UY': 'Uruguay',
  'UZ': 'Uzbekistan',
  'VU': 'Vanuatu',
  'VE': 'Venezuela',
  'VN': 'Vietnam',
  'YE': 'Yemen',
  'ZM': 'Zambia',
  'ZW': 'Zimbabwe'
      // Find more countries here: https://dev.maxmind.com/geoip/docs/databases/city-and-country/
    };

router.route('/geo')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        // Get All
        const cnts = await Country.find();    // Get All Countries
        return res.status(200).json(cnts);
    })
    .all((req, res) => {
      // Any other HTTP Method
      // Returns a message stating that the HTTP method is unsupported.
      res.status(405).send({ message: 'HTTP method not supported.' });
    });

router.route('/geo/:ip')
    .get(authJwtController.isAuthenticated, async (req, res) => {
      const ip = req.params.ip;
      obj = {ip:ip, country:null, deny: true };
      const geo = geoip.lookup(ip);
      if (geo) {
        obj.country = geo.country;
        var access = 'Denied ';
        obj.msg = 'IP Country: ' + geo.country;
        try { 
          var c = await Country.find({code: geo.country});
          if (c.length == 0)
            c = false;
        }
        catch { var c = false; }
        if (c) {
          obj.deny = false;
          access = 'Granted ';
        }
        obj.msg = access + obj.msg;
      } else 
        obj.msg = 'Country not found';
      // console.log(c);
      return res.status(200).json({...obj, success: true});
    })
    .all((req, res) => {
      // Any other HTTP Method
      // Returns a message stating that the HTTP method is unsupported.
      res.status(405).send({ message: 'HTTP method not supported.' });
    });

router.route('/geoedit/:country')
    .post(authJwtController.isAuthenticated, async (req, res) => {
      const cnt = req.params.country;
      var msg = '';
      if (!(cnt in countryCodes))
      {
        msg = 'Invalid Country code.\nValid Country codes:\n';
        for (const key in countryCodes)
          msg += key +": "+ countryCodes[key] + "\n";
      }
      if (msg != '')
        return res.status(404).json({success: false, message: msg});

      const country = new Country({
        code: cnt,
        country: countryCodes[cnt]
      });
      try {
        await country.save();
      } catch (err) {
        if (err.code === 11000) { // Strict equality check (===)
          return res.status(409).json({ success: false, message: 'Country already exists.' }); // 409 Conflict
        } else {
          console.error(err); // Log the error for debugging
          return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
        }
      }
      return res.status(201).json({ country: country, success: true });
    })
    .delete(authJwtController.isAuthenticated, async (req, res) => {
      const cnt = {code: req.params.country};
      try {
        var r = await Country.findOneAndDelete(cnt)
      } catch {
        r = false;
      }
      if (!r)
        return res.status(404).json({success: false, message: 'Unable to Delete Country.'});
      return res.status(200).json({success: true, message: 'Deleted Country.'});
    })
    .all((req, res) => {
      // Any other HTTP Method
      // Returns a message stating that the HTTP method is unsupported.
      res.status(405).send({ message: 'HTTP method not supported.' });
    });

app.use('/', router);

const PORT = process.env.PORT || 8080; // Define PORT before using it
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // for testing only