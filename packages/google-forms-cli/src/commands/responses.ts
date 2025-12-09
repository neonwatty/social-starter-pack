import { getAuthenticatedClient } from "../auth";
import {
  getResponses,
  getResponseCount,
  exportResponsesAsCSV,
  exportResponsesAsJSON,
} from "../api/responses";
import { error, info, printJson, printTable } from "../utils/output";

export async function handleResponses(args: string[]): Promise<void> {
  let formId: string | undefined;
  let format: "json" | "csv" | "table" = "table";
  let countOnly = false;
  let limit: number | undefined;
  let afterTimestamp: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--format" || arg === "-f") {
      format = args[++i] as "json" | "csv" | "table";
    } else if (arg === "--json") {
      format = "json";
    } else if (arg === "--csv") {
      format = "csv";
    } else if (arg === "--count") {
      countOnly = true;
    } else if (arg === "--limit" || arg === "-l") {
      limit = parseInt(args[++i], 10);
    } else if (arg === "--after") {
      afterTimestamp = args[++i];
    } else if (!arg.startsWith("-")) {
      formId = arg;
    }
  }

  if (!formId) {
    error(
      'Usage: gforms responses <form-id> [--format json|csv|table] [--count] [--limit N] [--after "YYYY-MM-DD"]'
    );
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();

    if (countOnly) {
      const count = await getResponseCount(auth, formId);
      console.log(count);
      return;
    }

    const options = { limit, afterTimestamp };

    if (format === "csv") {
      const csv = await exportResponsesAsCSV(auth, formId, options);
      if (!csv) {
        info("No responses found.");
      } else {
        console.log(csv);
      }
    } else if (format === "json") {
      const json = await exportResponsesAsJSON(auth, formId, options);
      printJson(json);
    } else {
      // Table format - simplified view
      const responses = await getResponses(auth, formId, options);

      if (responses.length === 0) {
        info("No responses found.");
        return;
      }

      printTable(
        ["Response ID", "Submitted", "Email"],
        responses.map((r) => [
          r.responseId.slice(0, 12) + "...",
          new Date(r.createTime).toLocaleString(),
          r.respondentEmail || "(anonymous)",
        ])
      );

      console.log(`\nTotal: ${responses.length} responses`);
    }
  } catch (err) {
    error(`Failed to get responses: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

export async function handleWatch(args: string[]): Promise<void> {
  let formId: string | undefined;
  let interval = 60; // seconds
  let execCommand: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--interval" || arg === "-i") {
      interval = parseInt(args[++i], 10);
    } else if (arg === "--exec") {
      execCommand = args[++i];
    } else if (!arg.startsWith("-")) {
      formId = arg;
    }
  }

  if (!formId) {
    error('Usage: gforms watch <form-id> [--interval <seconds>] [--exec "command"]');
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();

    info(`Watching for new responses every ${interval} seconds...`);
    info("Press Ctrl+C to stop.\n");

    let lastResponseCount = await getResponseCount(auth, formId);
    console.log(`Current response count: ${lastResponseCount}`);

    const checkForResponses = async () => {
      try {
        const currentCount = await getResponseCount(auth, formId!);

        if (currentCount > lastResponseCount) {
          const newCount = currentCount - lastResponseCount;
          console.log(`\n[${new Date().toLocaleTimeString()}] ${newCount} new response(s)!`);

          if (execCommand) {
            const { exec } = await import("child_process");
            exec(execCommand, (err, stdout, stderr) => {
              if (stdout) console.log(stdout);
              if (stderr) console.error(stderr);
            });
          }

          lastResponseCount = currentCount;
        }
      } catch (err) {
        console.error(
          `Error checking responses: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    };

    // Run check periodically
    setInterval(checkForResponses, interval * 1000);

    // Keep process running
    process.on("SIGINT", () => {
      console.log("\nStopped watching.");
      process.exit(0);
    });
  } catch (err) {
    error(`Failed to watch form: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
