// ## **Part 1: Number Facts**

// 1. Make a request to the Numbers API (http://numbersapi.com/) to get a fact about your favorite number.
//      (Make sure you get back JSON by including the ***json*** query key, specific to this API. [Details](http://numbersapi.com/#json).
// 2. Figure out how to get data on multiple numbers in a single request.
//      Make that request and when you get the data back, put all of the number facts on the page.
// 3. Use the API to get 4 facts on your favorite number.
//      Once you have them all, put them on the page. It’s okay if some of the facts are repeats.

//     *(Note: You’ll need to make multiple requests for this.)*

// Wait for submit/"Get Facts" button to be pressed, then process input
document
  .getElementById("factForm")
  .addEventListener("submit", function (event) {
    // Prevent browser from reloading page on submit (default form submission)
    event.preventDefault();

    // Immediately provide visual feedback: make the submit button into a loading bar and change its text to 'Loading...'
    const submitButton = document.querySelector("#factForm button");
    const progressBar = document.getElementById("progressBar");
    const originalButtonText = submitButton.textContent;
    submitButton.style.transition = "opacity 0s ease";
    submitButton.disabled = true;
    submitButton.style.opacity = "0"; // Hide button text and background
    progressBar.textContent = "Loading...";

    submitButton.style.opacity = "0"; // hide the button so the progress bar shows

    // Get input from user
    const numbersInput = document.getElementById("numberInput").value;

    // Clean the input and convert to array
    let usableNumber = numbersInput.replace(/[^\d.,-]/g, "");
    const normalizedInput = usableNumber
      .replace(/\.{2,}/g, "..") // collapse 2+ periods to `..` for ranges
      .replace(/-{2,}/g, "-") // collapse 2+ dashes to `-`
      .replace(/,+/g, ",") // collapse multiple commas
      .replace(/^,+|,+$/g, "") // remove leading/trailing commas
      .replace(/(^|[^0-9])\.(?=[^0-9]|$)/g, "")
      .replace(/(?<!\.)\.(?=\d)(?!\.)/g, "") // remove leading decimals not part of `..`
      .replace(/(\.\.)\.(?=\.)*/g, "$1") // remove extra dots after valid range
      .replace(/^\.+|\.+$/g, "") // remove leading/trailing dots
      .replace(/(?<!\.)\.(?!\.)(?=,|$)/g, ""); // remove single trailing dots, keep valid `..`
    document.getElementById("numberInput").value = normalizedInput;
    const numbers = normalizedInput
      .split(",")
      .map((number) => number.trim())
      .filter((number) => number !== "");

    // Clean up duplicates, including from ranges

    // Edge case: No valid numbers input, provide feedback
    if (numbers.length === 0) {
      document.getElementById("results").textContent =
        "Please provide one or more comma-separated numbers or ranges";

      submitButton.style.transition = "opacity 0.5s ease";
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      submitButton.style.backgroundColor = "#007aff";
      submitButton.style.textAlign = "center";
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
      } else if (number.includes("-")) {
        const parts = number.split("-").map(Number);
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
    const numbersArray = numbers
      .reduce(
        (accumulator, number) => accumulator.concat(parseNumber(number)),
        []
      )
      .filter(Number.isInteger); // Filter out non-integer values

    const uniqueNumbersArray = Array.from(new Set(numbersArray)).sort(
      (a, b) => a - b
    );

    const condensed = [];
    let start = uniqueNumbersArray[0];
    let end = start;

    for (let i = 1; i <= uniqueNumbersArray.length; i++) {
      const current = uniqueNumbersArray[i];
      if (current === end + 1) {
        end = current;
      } else {
        if (start === end) {
          condensed.push(`${start}`);
        } else if (end === start + 1) {
          condensed.push(`${start},${end}`);
        } else {
          condensed.push(`${start}..${end}`);
        }
        start = end = current;
      }
    }

    document.getElementById("numberInput").value = condensed.join(",");

    // Edge case: No valid integers input, provide feedback
    if (uniqueNumbersArray.length === 0) {
      document.getElementById("results").textContent =
        "Please enter whole numbers or valid ranges (e.g., 3, 5..10, or 1-4).";

      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      submitButton.style.backgroundColor = "#007aff";
      submitButton.style.textAlign = "center";
      return;
    }

    // Initialize progress: total numbers to process
    const totalNumbers = uniqueNumbersArray.length;
    let resolvedCount = 0;
    updateProgress(0, totalNumbers);

    // Function to update the progress bar.
    // function updateProgress(completed, total) {
    //   const percent = Math.round((completed / total) * 100);
    //   const progressBar = document.getElementById("submitButton");
    //   if (progressBar) {
    //     progressBar.style.background = `linear-gradient(to right, #007aff ${percent}%, #ffffff ${percent}%)`;
    //     // Make it visible when progress starts
    //     progressBar.style.opacity = percent > 0 ? 1 : 0;
    //     progressBar.style.textAlign = "left";
    //   } else {
    //     console.error("Progress bar element not found.");
    //   }
    // }

    function updateProgress(completed, total) {
      const percent = Math.round((completed / total) * 100);
      // const progressBar = document.getElementById("progressBar");
      if (progressBar) {
        progressBar.style.width = percent + "%";
      }
    }

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
    const allPromises = uniqueNumbersArray.map((number) => {
      return fetchNumberFacts(number).then((facts) => {
        ++resolvedCount;
        updateProgress(resolvedCount, totalNumbers);
        return { number, facts };
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
          h3.textContent = `${result.number}`;
          resultsDiv.appendChild(h3);

          result.facts.forEach((fact) => {
            const p = document.createElement("p");
            p.textContent = fact;
            resultsDiv.appendChild(p);
          });
        });

        submitButton.textContent = originalButtonText;
        submitButton.style.color = "#ffffff"; // reset text color
        submitButton.style.backgroundColor = "#007aff";
        submitButton.style.textAlign = "center";
        submitButton.style.opacity = "1"; // show the button again
      })

      // Log error and display generic error on page
      .catch((error) => {
        console.error("Fetch error: ", error);
        document.getElementById("results").textContent =
          "Error fetching facts.";
        submitButton.style.opacity = "1";
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.style.opacity = "1"; // show the button again
      });
  });
