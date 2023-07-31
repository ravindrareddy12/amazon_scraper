const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const BASE_URL = 'https://www.amazon.in/s';
const SEARCH_QUERY = 'bags';
const MAX_PAGES = 20;

const csvWriter = createCsvWriter({
  path: 'scraped_data.csv',
  header: [
    { id: 'productURL', title: 'Product URL' },
    { id: 'productName', title: 'Product Name' },
    { id: 'productPrice', title: 'Product Price' },
    { id: 'rating', title: 'Rating' },
    { id: 'numOfReviews', title: 'Number of Reviews' },
    { id: 'description', title: 'Description' },
    { id: 'asin', title: 'ASIN' },
    { id: 'productDescription', title: 'Product Description' },
    { id: 'manufacturer', title: 'Manufacturer' },
  ],
});

const scrapeProductDetails = async (productURL) => {
  try {
    const response = await axios.get(productURL);
    const $ = cheerio.load(response.data);

    const productName = $('#productTitle').text().trim();
    const productPrice = $('#priceblock_ourprice').text().trim();
    const rating = $('#acrPopover').attr('title');
    const numOfReviews = $('#acrCustomerReviewText').text().trim();
    const description = $('#productDescription').text().trim();
    const asin = $('input[name="ASIN"]').val().trim();
    const productDescription = $('#productDetails_techSpec_section_1').text().trim();
    const manufacturer = $('#bylineInfo').text().trim();

    return {
      productURL,
      productName,
      productPrice,
      rating,
      numOfReviews,
      description,
      asin,
      productDescription,
      manufacturer,
    };
  } catch (error) {
    console.error('Error while scraping product details:', error);
    return null;
  }
};

const scrapeProducts = async (page) => {
  const params = {
    k: SEARCH_QUERY,
    crid: '2M096C61O4MLT',
    qid: 1653308124,
    sprefix: 'ba%2Caps%2C283',
    ref: `sr_pg_${page}`,
  };

  try {
    const response = await axios.get(BASE_URL, { params });
    const $ = cheerio.load(response.data);

    const productLinks = [];
    $('.a-link-normal.a-text-normal').each((index, element) => {
      const productURL = $(element).attr('href');
      productLinks.push('https://www.amazon.in' + productURL);
    });

    const productDetails = [];
    for (const url of productLinks) {
      const details = await scrapeProductDetails(url);
      if (details) {
        productDetails.push(details);
      }
    }

    return productDetails;
  } catch (error) {
    console.error('Error while scraping product list:', error);
    return [];
  }
};

const scrapeAllPages = async () => {
  const allProductDetails = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    console.log(`Scraping page ${page}...`);
    const productDetails = await scrapeProducts(page);
    allProductDetails.push(...productDetails);
  }

  csvWriter.writeRecords(allProductDetails).then(() => {
    console.log('CSV file successfully created.');
  });
};

scrapeAllPages();
