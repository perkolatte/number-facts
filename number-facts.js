// ## Number Facts
// Fetch facts from the Numbers API and display them on the page.

// Clean the input and convert to array
function normalizeInput(input) {
  // Clean and normalize the input with a chain of regex replacements.
  let normalized = input
    .replace(/[^\d.,-]/g, "")
    .replace(/\.{2,}/g, "..") // collapse 2+ periods to `..` for ranges
    .replace(/-{2,}/g, "-") // collapse 2+ dashes to `-`
    .replace(/,+/g, ",") // collapse multiple commas
    .replace(/^,+|,+$/g, "") // remove leading/trailing commas
    .replace(/(^|[^0-9])\.(?=[^0-9]|$)/g, "")
    .replace(/(?<!\.)\.(?=\d)(?!\.)/g, "") // remove leading decimals not part of `..`
    .replace(/(\.\.)\.(?=\.)*/g, "$1") // remove extra dots after valid range
    .replace(/^\.+|\.+$/g, "") // remove leading/trailing dots
    .replace(/(?<!\.)\.(?!\.)(?=,|$)/g, ""); // remove single trailing dots, keep valid `..`

  // Process tokens to ensure ranges with multiple ".." are reduced to only use the first and last parts.
  const tokens = normalized.split(",");
  const fixedTokens = tokens.map((token) => {
    if (token.indexOf("..") !== -1) {
      const parts = token.split("..");
      return parts.length > 2
        ? parts[0] + ".." + parts[parts.length - 1]
        : token;
    }
    return token;
  });
  normalized = fixedTokens.join(",");

  // Update the input value once after all normalization is done.
  document.getElementById("numberInput").value = normalized;
  return normalized;
}

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

    normalizedInput = normalizeInput(numbersInput);

    const numbers = normalizedInput
      .split(",")
      .map((number) => number.trim())
      .filter((number) => number !== "");

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
        const [start, end] = number.split("..").map(Number);
        const result = [];
        // Generate an inclusive range from start to end
        for (let i = start; i <= end; i++) {
          result.push(i);
        }
        return result;
      } else if (number.includes("-")) {
        const [start, end] = number.split("-").map(Number);
        const result = [];
        // Generate an inclusive range from start to end
        for (let i = start; i <= end; i++) {
          result.push(i);
        }
        return result;
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

    function updateProgress(completed, total) {
      const percent = Math.min(100, Math.round((completed / total) * 100));
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

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    const fetchPromises = uniqueNumbersArray.map((number) => {
      return fetchNumberFacts(number)
        .then((facts) => {
          return { number, facts };
        })
        .catch((error) => {
          console.error("Fetch error for number:", number, error);
          return { number, facts: ["Error fetching facts."] };
        });
    });

    const resultsMap = new Map();

    function processFacts() {
      const firstFive = fetchPromises.slice(0, 5);
      const rest = fetchPromises.slice(5);

      return firstFive
        .reduce((chain, promise) => {
          return chain.then(() => {
            return promise.then(({ number, facts }) => {
              resultsMap.set(number, { number, facts });
              ++resolvedCount;
              updateProgress(resolvedCount, totalNumbers);

              const h3 = document.createElement("h3");
              h3.textContent = `${number}`;
              resultsDiv.appendChild(h3);

              facts.forEach((fact) => {
                const p = document.createElement("p");
                p.textContent = fact;
                resultsDiv.appendChild(p);
              });
            });
          });
        }, Promise.resolve())
        .then(() => {
          return Promise.all(
            rest.map((promise) =>
              promise.then(({ number, facts }) => {
                resultsMap.set(number, { number, facts });
                ++resolvedCount;
                updateProgress(resolvedCount, totalNumbers);

                // Sort all current results
                const sorted = Array.from(resultsMap.values()).sort(
                  (a, b) => a.number - b.number
                );

                resultsDiv.innerHTML = "";
                sorted.forEach(({ number, facts }) => {
                  const h3 = document.createElement("h3");
                  h3.textContent = `${number}`;
                  resultsDiv.appendChild(h3);

                  facts.forEach((fact) => {
                    const p = document.createElement("p");
                    p.textContent = fact;
                    resultsDiv.appendChild(p);
                  });
                });
              })
            )
          );
        })
        .catch((error) => {
          console.error("Error in processFacts:", error);
          // Return resolved promise to allow final .then() after processFacts() to run
          return Promise.resolve();
        });
    }

    processFacts()
      .then(() => {
        submitButton.textContent = originalButtonText;
        submitButton.style.color = "#ffffff";
        submitButton.style.backgroundColor = "#007aff";
        submitButton.style.textAlign = "center";
        submitButton.style.opacity = "1";
        progressBar.style.opacity = "0";
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.style.opacity = "1";
      });
  });
