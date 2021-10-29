binpath=$(npm bin)

if ! test -f "$binpath/anitracker"; then
    npm install anitracker-1.0.0.tgz
fi

export PATH="${binpath}:$PATH"
anitracker