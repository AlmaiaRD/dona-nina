cd "$(dirname "$0")"
rm -rf src/app/(dashboard)
node node_modules/.bin/next dev -p 3002
