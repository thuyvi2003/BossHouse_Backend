const axios = require("axios") ;
const dotenv = require("dotenv");
dotenv.config();

const GHN_API_BASE = process.env.GHN_API_BASE;
const GHN_TOKEN = process.env.GHN_TOKEN;
const FROM_DISTRICT = Number(process.env.GHN_FROM_DISTRICT); //Quan/Huyen cua shop
const FROM_WARD = process.env.GHN_FROM_WARD; //Phuong/Xa cua shop
const SHOP_ID = process.env.GHN_SHOP_ID;  //ID cua shop
exports.calculateShippingFee = async function ({ to_district, to_ward_code }) {
  if (!to_district || !to_ward_code ) { 
    throw new Error("Missing required fields: to_district, to_ward_code, shop_id");
  }
 console.log("Calculating shipping fee with:", { to_district, to_ward_code , GHN_API_BASE, GHN_TOKEN, FROM_DISTRICT, FROM_WARD, SHOP_ID});
  const serviceRes = await axios.post(
    `https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services`,
    {
      shop_id: Number(SHOP_ID),
      from_district: Number(FROM_DISTRICT),
      to_district: Number(to_district),
    },
    {
      headers: {
        token: GHN_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );
  console.log("Available services response:", serviceRes.data);
  const services = serviceRes.data?.data || [];
  if (!services.length) throw new Error("No available service found");
//Calculate fee for the first available service
  const { service_id, service_type_id } = services[0];

  const feeRes = await axios.post(
    `https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee`,
    {
      from_district_id: FROM_DISTRICT,
      from_ward_code: FROM_WARD,
      to_district_id: to_district,
      to_ward_code,
      service_id,
      service_type_id,
      weight: 500, // gram
      length: 20,
      width: 20,
      height: 10,
      insurance_value: 0,
      cod_failed_amount: 0,
    },
    {
      headers: {
        token: GHN_TOKEN,
        shop_id: SHOP_ID,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    service: services[0],
    fee: feeRes.data?.data,
  };
}
