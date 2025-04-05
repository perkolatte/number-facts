// ## **Part 1: Number Facts**

// 1. Make a request to the Numbers API (http://numbersapi.com/) to get a fact about your favorite number.
//      (Make sure you get back JSON by including the ***json*** query key, specific to this API. [Details](http://numbersapi.com/#json).
// 2. Figure out how to get data on multiple numbers in a single request.
//      Make that request and when you get the data back, put all of the number facts on the page.
// 3. Use the API to get 4 facts on your favorite number.
//      Once you have them all, put them on the page. It’s okay if some of the facts are repeats.

//     *(Note: You’ll need to make multiple requests for this.)*
// const numberFacts = (number) => `http://numbersapi.com/${number}?json`;

// Wait for submit button to be pressed, then process input
document
  .getElementById("factForm")
  .addEventListener("submit", function (event) {
    // Prevent browser from reloading page on submit (default form submission)
    event.preventDefault();

    // Get input from user
    const numbersInput = document.getElementById("numberInput").value;

    // Clean the input and convert to array
    let usableNumber = numbersInput.replace(/[^\d.,]/g, "");
    const numbers = usableNumber
      .split(",")
      .map((number) => number.trim())
      .filter((number) => number !== "");

    // Edge case: No valid numbers input, provide feedback
    if (numbers.length === 0) {
      document.getElementById("results").textContent =
        "Please provide one or more comma-separated numbers or ranges";
      return;
    }

    // Helper function: Generate an array for each range provided, pass single numbers through
    function parseNumber(number) {
      if (number.includes("..")) {
        const parts = number.split("..").map(Number);
        const [start, end] = parts;
        const numbers = [];
        // Generate an inclusive range from start to end
        for (let i = start; i <= end; i++) {
          numbers.push(i);
        }
        return numbers;
      } else {
        return [Number(number)];
      }
    }

    // Builds a flat array of numbers from individual numbers and arrays from ranges
    const numbersArray = numbers.reduce(
      (accumulator, number) => accumulator.concat(parseNumber(number)),
      []
    );

    // Fetch 4 unique facts for a given number from the Numbers API: http://numbersapi.com/#42
    function fetchNumberFacts(number) {
      const apiUrl = `http://numbersapi.com/${number}?json`;
      const uniqueFacts = new Set();

      // Recursive function that fetches 4 unique facts, or gives up after 20 api calls are made and returns unique facts so far
      function fetchUnique(callCount = 0) {
        ++callCount;
        if (callCount > 20) {
          return Promise.resolve(Array.from(uniqueFacts));
        }
        return fetch(apiUrl)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not OK.");
            }
            return response.json();
          })
          .then((data) => {
            if (data.text) {
              uniqueFacts.add(data.text);
            }
            if (uniqueFacts.size < 4) {
              return fetchUnique(callCount);
            } else {
              return Array.from(uniqueFacts);
            }
          });
      }
      return fetchUnique();
    }

    // Create a promise for each number that fetches its facts
    const allPromises = numbersArray.map((number) => {
      return fetchNumberFacts(number).then((facts) => {
        return { number: number, facts: facts };
      });
    });

    // Wait for all promises to resolve.
    Promise.all(allPromises)

      // Clear results div, create and display a heading and p tag for each number
      .then((results) => {
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";

        results.forEach((result) => {
          const h3 = document.createElement("h3");
          h3.textContent = `Number: ${result.number}`;
          resultsDiv.appendChild(h3);

          result.facts.forEach((fact) => {
            const p = document.createElement("p");
            p.textContent = fact;
            resultsDiv.appendChild(p);
          });
        });
      })

      // Log error and display generic error on page
      .catch((error) => {
        console.error("Fetch error: ", error);
        document.getElementById("results").textContent =
          "Error fetching facts.";
      });
  });

// function numberFacts(...numbers) {
//   if (numbers.length > 100) {
//     throw new Error("Too many inputs! Maximum allowed is 100.");
//   }
//   const numbersString = numbers.join(",");

//   retrieveAndParse(numbersString);
// }

// function retrieveAndParse(numbersString) {
//   fetch()
//     .then((response) => (json = response.json()))
//     .then((json) => console.log(json))
//     .catch(console.error);
// }

// numberFacts([3, 30, 300, 3000]);
