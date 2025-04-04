// ## **Part 1: Number Facts**

// 1. Make a request to the Numbers API (http://numbersapi.com/) to get a fact about your favorite number.
//      (Make sure you get back JSON by including the ***json*** query key, specific to this API. [Details](http://numbersapi.com/#json).
// 2. Figure out how to get data on multiple numbers in a single request.
//      Make that request and when you get the data back, put all of the number facts on the page.
// 3. Use the API to get 4 facts on your favorite number.
//      Once you have them all, put them on the page. It’s okay if some of the facts are repeats.

//     *(Note: You’ll need to make multiple requests for this.)*
// const numberFacts = (number) => `http://numbersapi.com/${number}?json`;

function numberFacts(...numbers) {
  if (numbers.length > 100) {
    throw new Error("Too many inputs! Maximum allowed is 100.");
  }
  const numbersString = numbers.join(",");

  retrieveAndParse(numbersString);
}

function retrieveAndParse(numbersString) {
  fetch(`http://numbersapi.com/${numbersString}?json`)
    .then((response) => (json = response.json()))
    .then((json) => console.log(json))
    .catch(console.error);
}

numberFacts([3, 30, 300, 3000]);
