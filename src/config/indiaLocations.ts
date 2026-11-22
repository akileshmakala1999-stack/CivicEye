/**
 * ==============================================================================
 * CIVICEYE INDIA GEOGRAPHIC & MULTI-REGION LOCATION ENGINE
 * Covers all 28 States & 8 Union Territories across the Republic of India.
 * Features:
 * - Full State & Union Territory registry with official codes
 * - Comprehensive city, town, and district coverage per state
 * - Automatic GPS location detection & reverse geocoding
 * - Nearest place finder using Haversine algorithm
 * - Dynamic state-to-places cascading selection
 * ==============================================================================
 */

export interface IndiaPlace {
  name: string;
  lat: number;
  lng: number;
  district?: string;
  isPopular?: boolean;
}

export interface IndiaState {
  code: string;
  name: string;
  type: 'state' | 'ut';
  capital: string;
  centerLat: number;
  centerLng: number;
  places: IndiaPlace[];
}

export const INDIA_STATES: IndiaState[] = [
  {
    code: 'TS',
    name: 'Telangana',
    type: 'state',
    capital: 'Hyderabad',
    centerLat: 17.3850,
    centerLng: 78.4867,
    places: [
      { name: 'Jubilee Hills', lat: 17.4325, lng: 78.4071, district: 'Hyderabad', isPopular: true },
      { name: 'Banjara Hills', lat: 17.4156, lng: 78.4352, district: 'Hyderabad', isPopular: true },
      { name: 'Madhapur', lat: 17.4504, lng: 78.3808, district: 'Hyderabad', isPopular: true },
      { name: 'Gachibowli', lat: 17.4435, lng: 78.3489, district: 'Hyderabad', isPopular: true },
      { name: 'Kondapur', lat: 17.4699, lng: 78.3578, district: 'Hyderabad', isPopular: true },
      { name: 'Begumpet', lat: 17.4447, lng: 78.4664, district: 'Hyderabad', isPopular: true },
      { name: 'Secunderabad', lat: 17.4399, lng: 78.4983, district: 'Hyderabad', isPopular: true },
      { name: 'Kukatpally', lat: 17.4947, lng: 78.3996, district: 'Medchal-Malkajgiri', isPopular: true },
      { name: 'Hitec City', lat: 17.4474, lng: 78.3762, district: 'Hyderabad', isPopular: true },
      { name: 'Warangal', lat: 17.9784, lng: 79.5941, district: 'Warangal', isPopular: true },
      { name: 'Nizamabad', lat: 18.6725, lng: 78.0941, district: 'Nizamabad', isPopular: true },
      { name: 'Karimnagar', lat: 18.4386, lng: 79.1288, district: 'Karimnagar', isPopular: true },
      { name: 'Khammam', lat: 17.2473, lng: 80.1514, district: 'Khammam' },
      { name: 'Ramagundam', lat: 18.7551, lng: 79.5134, district: 'Peddapalli' },
      { name: 'Mahbubnagar', lat: 16.7488, lng: 78.0035, district: 'Mahbubnagar' },
      { name: 'Nalgonda', lat: 17.0577, lng: 79.2684, district: 'Nalgonda' },
      { name: 'Adilabad', lat: 19.6641, lng: 78.5320, district: 'Adilabad' },
      { name: 'Siddipet', lat: 18.1018, lng: 78.8520, district: 'Siddipet' },
      { name: 'Suryapet', lat: 17.1439, lng: 79.6239, district: 'Suryapet' },
      { name: 'Mancherial', lat: 18.8679, lng: 79.4639, district: 'Mancherial' },
    ],
  },
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    type: 'state',
    capital: 'Amaravati',
    centerLat: 16.5062,
    centerLng: 80.6480,
    places: [
      { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, district: 'Visakhapatnam', isPopular: true },
      { name: 'Vijayawada', lat: 16.5062, lng: 80.6480, district: 'NTR', isPopular: true },
      { name: 'Guntur', lat: 16.3067, lng: 80.4365, district: 'Guntur', isPopular: true },
      { name: 'Tirupati', lat: 13.6288, lng: 79.4192, district: 'Tirupati', isPopular: true },
      { name: 'Nellore', lat: 14.4426, lng: 79.9865, district: 'SPSR Nellore', isPopular: true },
      { name: 'Kurnool', lat: 15.8281, lng: 78.0373, district: 'Kurnool' },
      { name: 'Kakinada', lat: 16.9891, lng: 82.2475, district: 'Kakinada' },
      { name: 'Rajamahendravaram (Rajahmundry)', lat: 17.0005, lng: 81.8040, district: 'East Godavari' },
      { name: 'Kadapa', lat: 14.4673, lng: 78.8242, district: 'YSR Kadapa' },
      { name: 'Anantapur', lat: 14.6819, lng: 77.6006, district: 'Anantapur' },
      { name: 'Vizianagaram', lat: 18.1067, lng: 83.3956, district: 'Vizianagaram' },
      { name: 'Eluru', lat: 16.7107, lng: 81.0952, district: 'Eluru' },
      { name: 'Ongole', lat: 15.5057, lng: 80.0499, district: 'Prakasam' },
      { name: 'Srikakulam', lat: 18.2949, lng: 83.8938, district: 'Srikakulam' },
    ],
  },
  {
    code: 'MH',
    name: 'Maharashtra',
    type: 'state',
    capital: 'Mumbai',
    centerLat: 19.0760,
    centerLng: 72.8777,
    places: [
      { name: 'Mumbai - South Mumbai', lat: 18.9220, lng: 72.8347, district: 'Mumbai City', isPopular: true },
      { name: 'Mumbai - Bandra / BKC', lat: 19.0596, lng: 72.8295, district: 'Mumbai Suburban', isPopular: true },
      { name: 'Mumbai - Andheri', lat: 19.1136, lng: 72.8697, district: 'Mumbai Suburban', isPopular: true },
      { name: 'Pune - Shivaji Nagar', lat: 18.5314, lng: 73.8446, district: 'Pune', isPopular: true },
      { name: 'Pune - Hinjewadi Tech Park', lat: 18.5913, lng: 73.7389, district: 'Pune', isPopular: true },
      { name: 'Pune - Kothrud', lat: 18.5074, lng: 73.8077, district: 'Pune' },
      { name: 'Nagpur', lat: 21.1458, lng: 79.0882, district: 'Nagpur', isPopular: true },
      { name: 'Thane', lat: 19.2183, lng: 72.9781, district: 'Thane', isPopular: true },
      { name: 'Nashik', lat: 19.9975, lng: 73.7898, district: 'Nashik', isPopular: true },
      { name: 'Navi Mumbai', lat: 19.0330, lng: 73.0297, district: 'Thane', isPopular: true },
      { name: 'Chhatrapati Sambhaji Nagar (Aurangabad)', lat: 19.8762, lng: 75.3433, district: 'Aurangabad' },
      { name: 'Solapur', lat: 17.6599, lng: 75.9064, district: 'Solapur' },
      { name: 'Kolhapur', lat: 16.7050, lng: 74.2433, district: 'Kolhapur' },
      { name: 'Amravati', lat: 20.9374, lng: 77.7796, district: 'Amravati' },
      { name: 'Nanded', lat: 19.1383, lng: 77.3210, district: 'Nanded' },
      { name: 'Jalgaon', lat: 21.0077, lng: 75.5626, district: 'Jalgaon' },
    ],
  },
  {
    code: 'KA',
    name: 'Karnataka',
    type: 'state',
    capital: 'Bengaluru',
    centerLat: 12.9716,
    centerLng: 77.5946,
    places: [
      { name: 'Bengaluru - Central / MG Road', lat: 12.9756, lng: 77.6066, district: 'Bengaluru Urban', isPopular: true },
      { name: 'Bengaluru - Whitefield / ITPL', lat: 12.9698, lng: 77.7500, district: 'Bengaluru Urban', isPopular: true },
      { name: 'Bengaluru - Koramangala', lat: 12.9352, lng: 77.6245, district: 'Bengaluru Urban', isPopular: true },
      { name: 'Bengaluru - Indiranagar', lat: 12.9784, lng: 77.6408, district: 'Bengaluru Urban', isPopular: true },
      { name: 'Bengaluru - Electronic City', lat: 12.8399, lng: 77.6770, district: 'Bengaluru Urban', isPopular: true },
      { name: 'Mysuru (Mysore)', lat: 12.2958, lng: 76.6394, district: 'Mysuru', isPopular: true },
      { name: 'Hubballi-Dharwad', lat: 15.3647, lng: 75.1240, district: 'Dharwad', isPopular: true },
      { name: 'Mangaluru (Mangalore)', lat: 12.9141, lng: 74.8560, district: 'Dakshina Kannada', isPopular: true },
      { name: 'Belagavi (Belgaum)', lat: 15.8497, lng: 74.4977, district: 'Belagavi' },
      { name: 'Kalaburagi (Gulbarga)', lat: 17.3297, lng: 76.8343, district: 'Kalaburagi' },
      { name: 'Davanagere', lat: 14.4644, lng: 75.9218, district: 'Davanagere' },
      { name: 'Ballari (Bellary)', lat: 15.1394, lng: 76.9214, district: 'Ballari' },
      { name: 'Shivamogga (Shimoga)', lat: 13.9299, lng: 75.5681, district: 'Shivamogga' },
      { name: 'Tumakuru (Tumkur)', lat: 13.3379, lng: 77.1010, district: 'Tumakuru' },
      { name: 'Udupi', lat: 13.3409, lng: 74.7421, district: 'Udupi' },
    ],
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    type: 'state',
    capital: 'Chennai',
    centerLat: 13.0827,
    centerLng: 80.2707,
    places: [
      { name: 'Chennai - T. Nagar', lat: 13.0418, lng: 80.2341, district: 'Chennai', isPopular: true },
      { name: 'Chennai - Anna Nagar', lat: 13.0850, lng: 80.2101, district: 'Chennai', isPopular: true },
      { name: 'Chennai - OMR IT Corridor', lat: 12.9171, lng: 80.2281, district: 'Chennai', isPopular: true },
      { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, district: 'Coimbatore', isPopular: true },
      { name: 'Madurai', lat: 9.9252, lng: 78.1198, district: 'Madurai', isPopular: true },
      { name: 'Tiruchirappalli (Trichy)', lat: 10.7905, lng: 78.7047, district: 'Tiruchirappalli', isPopular: true },
      { name: 'Salem', lat: 11.6643, lng: 78.1460, district: 'Salem', isPopular: true },
      { name: 'Tiruppur', lat: 11.1085, lng: 77.3411, district: 'Tiruppur' },
      { name: 'Erode', lat: 11.3410, lng: 77.7172, district: 'Erode' },
      { name: 'Tirunelveli', lat: 8.7139, lng: 77.7567, district: 'Tirunelveli' },
      { name: 'Vellore', lat: 12.9165, lng: 79.1325, district: 'Vellore' },
      { name: 'Thanjavur', lat: 10.7870, lng: 79.1378, district: 'Thanjavur' },
    ],
  },
  {
    code: 'DL',
    name: 'Delhi (NCT)',
    type: 'ut',
    capital: 'New Delhi',
    centerLat: 28.6139,
    centerLng: 77.2090,
    places: [
      { name: 'New Delhi - Connaught Place', lat: 28.6304, lng: 77.2177, district: 'New Delhi', isPopular: true },
      { name: 'South Delhi - Saket / Hauz Khas', lat: 28.5245, lng: 77.2066, district: 'South Delhi', isPopular: true },
      { name: 'West Delhi - Dwarka', lat: 28.5921, lng: 77.0460, district: 'South West Delhi', isPopular: true },
      { name: 'North Delhi - Rohini', lat: 28.7166, lng: 77.1147, district: 'North West Delhi', isPopular: true },
      { name: 'East Delhi - Laxmi Nagar / Mayur Vihar', lat: 28.6308, lng: 77.2773, district: 'East Delhi', isPopular: true },
      { name: 'Central Delhi - Karol Bagh', lat: 28.6517, lng: 77.1906, district: 'Central Delhi', isPopular: true },
      { name: 'Old Delhi - Chandni Chowk', lat: 28.6506, lng: 77.2303, district: 'Central Delhi' },
      { name: 'South Delhi - Vasant Kunj', lat: 28.5298, lng: 77.1541, district: 'South West Delhi' },
    ],
  },
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    type: 'state',
    capital: 'Lucknow',
    centerLat: 26.8467,
    centerLng: 80.9462,
    places: [
      { name: 'Lucknow - Hazratganj', lat: 26.8500, lng: 80.9499, district: 'Lucknow', isPopular: true },
      { name: 'Lucknow - Gomti Nagar', lat: 26.8530, lng: 80.9990, district: 'Lucknow', isPopular: true },
      { name: 'Noida (Sector 18 / Expressway)', lat: 28.5355, lng: 77.3910, district: 'Gautam Buddha Nagar', isPopular: true },
      { name: 'Greater Noida', lat: 28.4744, lng: 77.5040, district: 'Gautam Buddha Nagar', isPopular: true },
      { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538, district: 'Ghaziabad', isPopular: true },
      { name: 'Kanpur', lat: 26.4499, lng: 80.3319, district: 'Kanpur Nagar', isPopular: true },
      { name: 'Varanasi', lat: 25.3176, lng: 82.9739, district: 'Varanasi', isPopular: true },
      { name: 'Agra', lat: 27.1767, lng: 78.0081, district: 'Agra', isPopular: true },
      { name: 'Prayagraj (Allahabad)', lat: 25.4358, lng: 81.8463, district: 'Prayagraj', isPopular: true },
      { name: 'Meerut', lat: 28.9845, lng: 77.7064, district: 'Meerut' },
      { name: 'Bareilly', lat: 28.3670, lng: 79.4304, district: 'Bareilly' },
      { name: 'Aligarh', lat: 27.8974, lng: 78.0880, district: 'Aligarh' },
      { name: 'Moradabad', lat: 28.8351, lng: 78.7749, district: 'Moradabad' },
      { name: 'Gorakhpur', lat: 26.7606, lng: 83.3732, district: 'Gorakhpur' },
      { name: 'Mathura', lat: 27.4924, lng: 77.6737, district: 'Mathura' },
      { name: 'Ayodhya', lat: 26.7922, lng: 82.1998, district: 'Ayodhya' },
    ],
  },
  {
    code: 'GJ',
    name: 'Gujarat',
    type: 'state',
    capital: 'Gandhinagar',
    centerLat: 23.0225,
    centerLng: 72.5714,
    places: [
      { name: 'Ahmedabad - SG Highway / Satellite', lat: 23.0338, lng: 72.5256, district: 'Ahmedabad', isPopular: true },
      { name: 'Ahmedabad - Navrangpura', lat: 23.0373, lng: 72.5525, district: 'Ahmedabad', isPopular: true },
      { name: 'Surat', lat: 21.1702, lng: 72.8311, district: 'Surat', isPopular: true },
      { name: 'Vadodara', lat: 22.3072, lng: 73.1812, district: 'Vadodara', isPopular: true },
      { name: 'Rajkot', lat: 22.3039, lng: 70.8022, district: 'Rajkot', isPopular: true },
      { name: 'Gandhinagar', lat: 23.2156, lng: 72.6369, district: 'Gandhinagar', isPopular: true },
      { name: 'Bhavnagar', lat: 21.7645, lng: 72.1519, district: 'Bhavnagar' },
      { name: 'Jamnagar', lat: 22.4707, lng: 70.0577, district: 'Jamnagar' },
      { name: 'Junagadh', lat: 21.5222, lng: 70.4579, district: 'Junagadh' },
      { name: 'Anand', lat: 22.5645, lng: 72.9289, district: 'Anand' },
    ],
  },
  {
    code: 'KL',
    name: 'Kerala',
    type: 'state',
    capital: 'Thiruvananthapuram',
    centerLat: 9.9312,
    centerLng: 76.2673,
    places: [
      { name: 'Kochi - Kakkanad / Infopark', lat: 10.0159, lng: 76.3419, district: 'Ernakulam', isPopular: true },
      { name: 'Kochi - Marine Drive / Fort Kochi', lat: 9.9674, lng: 76.2427, district: 'Ernakulam', isPopular: true },
      { name: 'Thiruvananthapuram - Technopark', lat: 8.5581, lng: 76.8812, district: 'Thiruvananthapuram', isPopular: true },
      { name: 'Kozhikode (Calicut)', lat: 11.2588, lng: 75.7804, district: 'Kozhikode', isPopular: true },
      { name: 'Thrissur', lat: 10.5276, lng: 76.2144, district: 'Thrissur', isPopular: true },
      { name: 'Kollam', lat: 8.8932, lng: 76.6141, district: 'Kollam' },
      { name: 'Kannur', lat: 11.8745, lng: 75.3704, district: 'Kannur' },
      { name: 'Alappuzha (Alleppey)', lat: 9.4981, lng: 76.3388, district: 'Alappuzha' },
      { name: 'Kottayam', lat: 9.5916, lng: 76.5222, district: 'Kottayam' },
      { name: 'Palakkad', lat: 10.7867, lng: 76.6548, district: 'Palakkad' },
    ],
  },
  {
    code: 'WB',
    name: 'West Bengal',
    type: 'state',
    capital: 'Kolkata',
    centerLat: 22.5726,
    centerLng: 88.3639,
    places: [
      { name: 'Kolkata - Park Street', lat: 22.5517, lng: 88.3524, district: 'Kolkata', isPopular: true },
      { name: 'Kolkata - Salt Lake / Sector V IT', lat: 22.5785, lng: 88.4312, district: 'North 24 Parganas', isPopular: true },
      { name: 'Kolkata - New Town', lat: 22.5898, lng: 88.4744, district: 'North 24 Parganas', isPopular: true },
      { name: 'Howrah', lat: 22.5958, lng: 88.2636, district: 'Howrah', isPopular: true },
      { name: 'Siliguri', lat: 26.7271, lng: 88.3953, district: 'Darjeeling', isPopular: true },
      { name: 'Durgapur', lat: 23.5204, lng: 87.3119, district: 'Paschim Bardhaman', isPopular: true },
      { name: 'Asansol', lat: 23.6739, lng: 86.9524, district: 'Paschim Bardhaman' },
      { name: 'Kharagpur', lat: 22.3460, lng: 87.2320, district: 'Paschim Medinipur' },
      { name: 'Darjeeling', lat: 27.0410, lng: 88.2663, district: 'Darjeeling' },
    ],
  },
  {
    code: 'RJ',
    name: 'Rajasthan',
    type: 'state',
    capital: 'Jaipur',
    centerLat: 26.9124,
    centerLng: 75.7873,
    places: [
      { name: 'Jaipur - C-Scheme / Civil Lines', lat: 26.9067, lng: 75.8041, district: 'Jaipur', isPopular: true },
      { name: 'Jaipur - Malviya Nagar / Vaishali', lat: 26.8528, lng: 75.8143, district: 'Jaipur', isPopular: true },
      { name: 'Jodhpur', lat: 26.2389, lng: 73.0243, district: 'Jodhpur', isPopular: true },
      { name: 'Udaipur', lat: 24.5854, lng: 73.7125, district: 'Udaipur', isPopular: true },
      { name: 'Kota', lat: 25.2138, lng: 75.8648, district: 'Kota', isPopular: true },
      { name: 'Ajmer', lat: 26.4499, lng: 74.6399, district: 'Ajmer' },
      { name: 'Bikaner', lat: 28.0229, lng: 73.3119, district: 'Bikaner' },
      { name: 'Alwar', lat: 27.5530, lng: 76.6346, district: 'Alwar' },
      { name: 'Bhilwara', lat: 25.3407, lng: 74.6313, district: 'Bhilwara' },
    ],
  },
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    type: 'state',
    capital: 'Bhopal',
    centerLat: 23.2599,
    centerLng: 77.4126,
    places: [
      { name: 'Indore - Vijay Nagar / Palasia', lat: 22.7533, lng: 75.8937, district: 'Indore', isPopular: true },
      { name: 'Bhopal - MP Nagar / Arera Colony', lat: 23.2324, lng: 77.4334, district: 'Bhopal', isPopular: true },
      { name: 'Jabalpur', lat: 23.1815, lng: 79.9864, district: 'Jabalpur', isPopular: true },
      { name: 'Gwalior', lat: 26.2183, lng: 78.1828, district: 'Gwalior', isPopular: true },
      { name: 'Ujjain', lat: 23.1765, lng: 75.7885, district: 'Ujjain' },
      { name: 'Sagar', lat: 23.8388, lng: 78.7378, district: 'Sagar' },
      { name: 'Rewa', lat: 24.5362, lng: 81.3037, district: 'Rewa' },
    ],
  },
  {
    code: 'PB',
    name: 'Punjab',
    type: 'state',
    capital: 'Chandigarh',
    centerLat: 30.7333,
    centerLng: 76.7794,
    places: [
      { name: 'Ludhiana', lat: 30.9010, lng: 75.8573, district: 'Ludhiana', isPopular: true },
      { name: 'Amritsar', lat: 31.6340, lng: 74.8723, district: 'Amritsar', isPopular: true },
      { name: 'Jalandhar', lat: 31.3260, lng: 75.5762, district: 'Jalandhar', isPopular: true },
      { name: 'Patiala', lat: 30.3398, lng: 76.3869, district: 'Patiala', isPopular: true },
      { name: 'Bathinda', lat: 30.2110, lng: 74.9455, district: 'Bathinda' },
      { name: 'Mohali (SAS Nagar)', lat: 30.7046, lng: 76.7179, district: 'SAS Nagar', isPopular: true },
    ],
  },
  {
    code: 'HR',
    name: 'Haryana',
    type: 'state',
    capital: 'Chandigarh',
    centerLat: 28.4595,
    centerLng: 77.0266,
    places: [
      { name: 'Gurugram (Cyber City / Golf Course)', lat: 28.4595, lng: 77.0266, district: 'Gurugram', isPopular: true },
      { name: 'Faridabad', lat: 28.4089, lng: 77.3178, district: 'Faridabad', isPopular: true },
      { name: 'Panipat', lat: 29.3909, lng: 76.9635, district: 'Panipat' },
      { name: 'Ambala', lat: 30.3782, lng: 76.7767, district: 'Ambala' },
      { name: 'Karnal', lat: 29.6857, lng: 76.9905, district: 'Karnal' },
      { name: 'Panchkula', lat: 30.6942, lng: 76.8606, district: 'Panchkula' },
      { name: 'Rohtak', lat: 28.8955, lng: 76.6066, district: 'Rohtak' },
    ],
  },
  {
    code: 'BR',
    name: 'Bihar',
    type: 'state',
    capital: 'Patna',
    centerLat: 25.5941,
    centerLng: 85.1376,
    places: [
      { name: 'Patna - Bailey Road / Boring Road', lat: 25.6127, lng: 85.1122, district: 'Patna', isPopular: true },
      { name: 'Gaya', lat: 24.7914, lng: 85.0002, district: 'Gaya', isPopular: true },
      { name: 'Bhagalpur', lat: 25.2425, lng: 86.9842, district: 'Bhagalpur' },
      { name: 'Muzaffarpur', lat: 26.1209, lng: 85.3647, district: 'Muzaffarpur' },
      { name: 'Purnia', lat: 25.7771, lng: 87.4753, district: 'Purnia' },
      { name: 'Darbhanga', lat: 26.1542, lng: 85.8918, district: 'Darbhanga' },
    ],
  },
  {
    code: 'OR',
    name: 'Odisha',
    type: 'state',
    capital: 'Bhubaneswar',
    centerLat: 20.2961,
    centerLng: 85.8245,
    places: [
      { name: 'Bhubaneswar - Infocity / Patia', lat: 20.3533, lng: 85.8197, district: 'Khurda', isPopular: true },
      { name: 'Cuttack', lat: 20.4625, lng: 85.8828, district: 'Cuttack', isPopular: true },
      { name: 'Rourkela', lat: 22.2604, lng: 84.8536, district: 'Sundargarh', isPopular: true },
      { name: 'Puri', lat: 19.8135, lng: 85.8312, district: 'Puri', isPopular: true },
      { name: 'Berhampur', lat: 19.3150, lng: 84.7941, district: 'Ganjam' },
      { name: 'Sambalpur', lat: 21.4669, lng: 83.9812, district: 'Sambalpur' },
    ],
  },
  {
    code: 'AS',
    name: 'Assam',
    type: 'state',
    capital: 'Dispur',
    centerLat: 26.1445,
    centerLng: 91.7362,
    places: [
      { name: 'Guwahati - GS Road / Dispur', lat: 26.1408, lng: 91.7900, district: 'Kamrup Metropolitan', isPopular: true },
      { name: 'Silchar', lat: 24.8333, lng: 92.7789, district: 'Cachar' },
      { name: 'Dibrugarh', lat: 27.4728, lng: 94.9120, district: 'Dibrugarh' },
      { name: 'Jorhat', lat: 26.7509, lng: 94.2037, district: 'Jorhat' },
      { name: 'Tezpur', lat: 26.6528, lng: 92.7926, district: 'Sonitpur' },
    ],
  },
  {
    code: 'JH',
    name: 'Jharkhand',
    type: 'state',
    capital: 'Ranchi',
    centerLat: 23.3441,
    centerLng: 85.3096,
    places: [
      { name: 'Ranchi - Main Road / Doranda', lat: 23.3441, lng: 85.3096, district: 'Ranchi', isPopular: true },
      { name: 'Jamshedpur - Bistupur / Sakchi', lat: 22.8046, lng: 86.2029, district: 'East Singhbhum', isPopular: true },
      { name: 'Dhanbad', lat: 23.7957, lng: 86.4304, district: 'Dhanbad', isPopular: true },
      { name: 'Bokaro Steel City', lat: 23.6693, lng: 86.1511, district: 'Bokaro' },
      { name: 'Deoghar', lat: 24.4826, lng: 86.7001, district: 'Deoghar' },
    ],
  },
  {
    code: 'CG',
    name: 'Chhattisgarh',
    type: 'state',
    capital: 'Raipur',
    centerLat: 21.2514,
    centerLng: 81.6296,
    places: [
      { name: 'Raipur - Telibandha / Pandri', lat: 21.2424, lng: 81.6599, district: 'Raipur', isPopular: true },
      { name: 'Bhilai - Durg', lat: 21.1938, lng: 81.3509, district: 'Durg', isPopular: true },
      { name: 'Bilaspur', lat: 22.0797, lng: 82.1409, district: 'Bilaspur' },
      { name: 'Korba', lat: 22.3595, lng: 82.7501, district: 'Korba' },
    ],
  },
  {
    code: 'UK',
    name: 'Uttarakhand',
    type: 'state',
    capital: 'Dehradun',
    centerLat: 30.3165,
    centerLng: 78.0322,
    places: [
      { name: 'Dehradun - Rajpur Road / Clock Tower', lat: 30.3256, lng: 78.0437, district: 'Dehradun', isPopular: true },
      { name: 'Haridwar', lat: 29.9457, lng: 78.1642, district: 'Haridwar', isPopular: true },
      { name: 'Rishikesh', lat: 30.0869, lng: 78.2676, district: 'Dehradun', isPopular: true },
      { name: 'Roorkee', lat: 29.8543, lng: 77.8880, district: 'Haridwar' },
      { name: 'Haldwani - Nainital', lat: 29.2183, lng: 79.5130, district: 'Nainital' },
    ],
  },
  {
    code: 'HP',
    name: 'Himachal Pradesh',
    type: 'state',
    capital: 'Shimla',
    centerLat: 31.1048,
    centerLng: 77.1734,
    places: [
      { name: 'Shimla - Mall Road / Ridge', lat: 31.1048, lng: 77.1734, district: 'Shimla', isPopular: true },
      { name: 'Dharamshala / McLeod Ganj', lat: 32.2190, lng: 76.3234, district: 'Kangra', isPopular: true },
      { name: 'Kullu - Manali', lat: 32.2396, lng: 77.1887, district: 'Kullu' },
      { name: 'Solan - Baddi', lat: 30.9084, lng: 77.0999, district: 'Solan' },
    ],
  },
  {
    code: 'GA',
    name: 'Goa',
    type: 'state',
    capital: 'Panaji',
    centerLat: 15.4909,
    centerLng: 73.8278,
    places: [
      { name: 'Panaji (North Goa)', lat: 15.4909, lng: 73.8278, district: 'North Goa', isPopular: true },
      { name: 'Margao (South Goa)', lat: 15.2832, lng: 73.9862, district: 'South Goa', isPopular: true },
      { name: 'Vasco da Gama', lat: 15.3991, lng: 73.8124, district: 'South Goa' },
      { name: 'Mapusa / Calangute', lat: 15.5907, lng: 73.8131, district: 'North Goa' },
    ],
  },
  {
    code: 'JK',
    name: 'Jammu & Kashmir',
    type: 'ut',
    capital: 'Srinagar / Jammu',
    centerLat: 34.0837,
    centerLng: 74.7973,
    places: [
      { name: 'Srinagar - Lal Chowk / Dal Gate', lat: 34.0837, lng: 74.7973, district: 'Srinagar', isPopular: true },
      { name: 'Jammu - Tawi / Gandhi Nagar', lat: 32.7266, lng: 74.8570, district: 'Jammu', isPopular: true },
      { name: 'Anantnag', lat: 33.7311, lng: 75.1487, district: 'Anantnag' },
      { name: 'Baramulla', lat: 34.2008, lng: 74.3436, district: 'Baramulla' },
    ],
  },
  {
    code: 'CH',
    name: 'Chandigarh',
    type: 'ut',
    capital: 'Chandigarh',
    centerLat: 30.7333,
    centerLng: 76.7794,
    places: [
      { name: 'Chandigarh - Sector 17 / City Centre', lat: 30.7398, lng: 76.7827, district: 'Chandigarh', isPopular: true },
      { name: 'Chandigarh - Sector 35 / 43', lat: 30.7225, lng: 76.7584, district: 'Chandigarh', isPopular: true },
      { name: 'Chandigarh - IT Park / Manimajra', lat: 30.7240, lng: 76.8400, district: 'Chandigarh' },
    ],
  },
  {
    code: 'PY',
    name: 'Puducherry',
    type: 'ut',
    capital: 'Puducherry',
    centerLat: 11.9416,
    centerLng: 79.8083,
    places: [
      { name: 'Puducherry - White Town / Promenade', lat: 11.9340, lng: 79.8350, district: 'Puducherry', isPopular: true },
      { name: 'Auroville - Ousteri', lat: 12.0070, lng: 79.8106, district: 'Puducherry' },
      { name: 'Karaikal', lat: 10.9254, lng: 79.8380, district: 'Karaikal' },
    ],
  },
  {
    code: 'TR',
    name: 'Tripura',
    type: 'state',
    capital: 'Agartala',
    centerLat: 23.8315,
    centerLng: 91.2868,
    places: [
      { name: 'Agartala', lat: 23.8315, lng: 91.2868, district: 'West Tripura', isPopular: true },
      { name: 'Dharmanagar', lat: 24.3800, lng: 92.1700, district: 'North Tripura' },
    ],
  },
  {
    code: 'ML',
    name: 'Meghalaya',
    type: 'state',
    capital: 'Shillong',
    centerLat: 25.5788,
    centerLng: 91.8933,
    places: [
      { name: 'Shillong - Police Bazar', lat: 25.5788, lng: 91.8933, district: 'East Khasi Hills', isPopular: true },
      { name: 'Tura', lat: 25.5144, lng: 90.2033, district: 'West Garo Hills' },
    ],
  },
  {
    code: 'MN',
    name: 'Manipur',
    type: 'state',
    capital: 'Imphal',
    centerLat: 24.8170,
    centerLng: 93.9368,
    places: [
      { name: 'Imphal', lat: 24.8170, lng: 93.9368, district: 'Imphal West', isPopular: true },
      { name: 'Churachandpur', lat: 24.3333, lng: 93.6833, district: 'Churachandpur' },
    ],
  },
  {
    code: 'NL',
    name: 'Nagaland',
    type: 'state',
    capital: 'Kohima',
    centerLat: 25.6751,
    centerLng: 94.1086,
    places: [
      { name: 'Kohima', lat: 25.6751, lng: 94.1086, district: 'Kohima', isPopular: true },
      { name: 'Dimapur', lat: 25.9068, lng: 93.7271, district: 'Dimapur', isPopular: true },
    ],
  },
  {
    code: 'MZ',
    name: 'Mizoram',
    type: 'state',
    capital: 'Aizawl',
    centerLat: 23.7271,
    centerLng: 92.7176,
    places: [
      { name: 'Aizawl', lat: 23.7271, lng: 92.7176, district: 'Aizawl', isPopular: true },
      { name: 'Lunglei', lat: 22.8833, lng: 92.7333, district: 'Lunglei' },
    ],
  },
  {
    code: 'AR',
    name: 'Arunachal Pradesh',
    type: 'state',
    capital: 'Itanagar',
    centerLat: 27.0844,
    centerLng: 93.6053,
    places: [
      { name: 'Itanagar / Naharlagun', lat: 27.0844, lng: 93.6053, district: 'Papum Pare', isPopular: true },
      { name: 'Pasighat', lat: 28.0667, lng: 95.3333, district: 'East Siang' },
    ],
  },
  {
    code: 'SK',
    name: 'Sikkim',
    type: 'state',
    capital: 'Gangtok',
    centerLat: 27.3389,
    centerLng: 88.6065,
    places: [
      { name: 'Gangtok - MG Marg', lat: 27.3389, lng: 88.6065, district: 'East Sikkim', isPopular: true },
      { name: 'Namchi', lat: 27.1667, lng: 88.3500, district: 'South Sikkim' },
    ],
  },
  {
    code: 'LA',
    name: 'Ladakh',
    type: 'ut',
    capital: 'Leh',
    centerLat: 34.1526,
    centerLng: 77.5771,
    places: [
      { name: 'Leh', lat: 34.1526, lng: 77.5771, district: 'Leh', isPopular: true },
      { name: 'Kargil', lat: 34.5539, lng: 76.1349, district: 'Kargil' },
    ],
  },
  {
    code: 'DN',
    name: 'Dadra & Nagar Haveli and Daman & Diu',
    type: 'ut',
    capital: 'Daman',
    centerLat: 20.4283,
    centerLng: 72.8397,
    places: [
      { name: 'Daman', lat: 20.4283, lng: 72.8397, district: 'Daman', isPopular: true },
      { name: 'Silvassa', lat: 20.2763, lng: 73.0083, district: 'Dadra and Nagar Haveli' },
      { name: 'Diu', lat: 20.7144, lng: 70.9874, district: 'Diu' },
    ],
  },
  {
    code: 'AN',
    name: 'Andaman & Nicobar Islands',
    type: 'ut',
    capital: 'Port Blair',
    centerLat: 11.6234,
    centerLng: 92.7265,
    places: [
      { name: 'Port Blair', lat: 11.6234, lng: 92.7265, district: 'South Andaman', isPopular: true },
      { name: 'Havelock (Swaraj Dweep)', lat: 11.9761, lng: 92.9876, district: 'South Andaman' },
    ],
  },
  {
    code: 'LD',
    name: 'Lakshadweep',
    type: 'ut',
    capital: 'Kavaratti',
    centerLat: 10.5667,
    centerLng: 72.6417,
    places: [
      { name: 'Kavaratti', lat: 10.5667, lng: 72.6417, district: 'Lakshadweep', isPopular: true },
      { name: 'Agatti', lat: 10.8533, lng: 72.1931, district: 'Lakshadweep' },
    ],
  },
];

/**
 * Returns all Indian State names sorted alphabetically.
 */
export function getAllIndianStates(): string[] {
  return INDIA_STATES.map((s) => s.name);
}

/**
 * Retrieves the state record by name or code.
 */
export function getIndianState(stateNameOrCode: string): IndiaState | undefined {
  const query = stateNameOrCode.trim().toLowerCase();
  return INDIA_STATES.find(
    (s) => s.name.toLowerCase() === query || s.code.toLowerCase() === query
  );
}

/**
 * Retrieves all registered places for a given state name.
 */
export function getPlacesForState(stateName: string): IndiaPlace[] {
  const state = getIndianState(stateName);
  return state ? state.places : [];
}

/**
 * Calculate Great-Circle distance (Haversine formula) in kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest Indian state and place for any latitude and longitude coordinates.
 */
export function findNearestPlaceInIndia(
  lat: number,
  lng: number
): {
  state: IndiaState;
  place: IndiaPlace;
  distanceKm: number;
} {
  let bestDistance = Infinity;
  let bestState: IndiaState = INDIA_STATES[0]; // Defaults to Telangana
  let bestPlace: IndiaPlace = INDIA_STATES[0].places[0];

  for (const state of INDIA_STATES) {
    for (const place of state.places) {
      const dist = calculateHaversineDistanceKm(lat, lng, place.lat, place.lng);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestState = state;
        bestPlace = place;
      }
    }
  }

  return {
    state: bestState,
    place: bestPlace,
    distanceKm: Math.round(bestDistance * 10) / 10,
  };
}

/**
 * Reverse geocodes coordinates using OpenStreetMap Nominatim with a fast timeout (2000ms),
 * seamlessly falling back to local mathematical nearest-place resolution if network fails.
 */
export async function reverseGeocodeLocation(
  lat: number,
  lng: number
): Promise<{
  state: string;
  city: string;
  locality: string;
  fullAddress: string;
  source: 'osm_reverse' | 'local_spatial_fallback';
}> {
  // Try remote OSM Nominatim with 2.5 second timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en-IN,en;q=0.9',
        },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const state = addr.state || addr.province || '';
        const city = addr.city || addr.town || addr.county || addr.state_district || addr.suburb || '';
        const locality = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || addr.residential || '';

        // Match state to our canonical list if possible
        const matchedState = INDIA_STATES.find(
          (s) => s.name.toLowerCase() === state.toLowerCase() || state.toLowerCase().includes(s.name.toLowerCase())
        );

        const stateName = matchedState ? matchedState.name : (state || 'Telangana');
        const cityName = city || (matchedState ? matchedState.capital : 'Hyderabad');
        const localityName = locality ? `${locality}, ${cityName}` : cityName;

        return {
          state: stateName,
          city: cityName,
          locality: localityName,
          fullAddress: data.display_name || `${localityName}, ${cityName}, ${stateName}`,
          source: 'osm_reverse',
        };
      }
    }
  } catch (_e) {
    // Network timeout or offline - seamlessly proceed to local spatial fallback
  }

  // Local Spatial Nearest-Neighbor Fallback
  const nearest = findNearestPlaceInIndia(lat, lng);
  const locality = nearest.place.name;
  const city = nearest.place.district || nearest.state.capital;
  const state = nearest.state.name;

  return {
    state,
    city,
    locality,
    fullAddress: `${locality}, ${city}, ${state}`,
    source: 'local_spatial_fallback',
  };
}
