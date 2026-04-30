process.env.BROWSERSLIST_IGNORE_OLD_DATA = "true";
process.noDeprecation = true;

const script = process.argv[2];

if (!script) {
  throw new Error("A react-scripts command is required.");
}

process.argv = [process.argv[0], process.argv[1], ...process.argv.slice(3)];

require(`react-scripts/scripts/${script}`);
