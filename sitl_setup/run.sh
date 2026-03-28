#!/bin/bash
# Make sure line endings are LF for this file!!!

set -e

LAT=52.7805691
LON=-0.7079235
ALT=0.1
DIR=270
VEHICLE="ArduCopter"
FIRMWARE_VERSION="latest"

REPO_URL="https://github.com/ArduPilot/ardupilot.git"
DEFAULT_WORKTREE="/ardupilot"
CACHE_ROOT="/ardupilot_cache"

function vehicle_prefix() {
    if [ "$VEHICLE" = "ArduPlane" ]; then
        echo "Plane"
    else
        echo "Copter"
    fi
}

function vehicle_channel_prefix() {
    if [ "$VEHICLE" = "ArduPlane" ]; then
        echo "ArduPlane"
    else
        echo "ArduCopter"
    fi
}

function is_pinned_firmware() {
    local selector
    selector="${FIRMWARE_VERSION,,}"
    [ "$selector" != "latest" ] && [ "$selector" != "stable" ]
}

function list_valid_release_versions() {
    local prefix
    prefix=$(vehicle_prefix)

    git ls-remote --refs --tags "$REPO_URL" "refs/tags/${prefix}-*" 2>/dev/null \
        | awk -F'refs/tags/' '{print $2}' \
        | sed -nE "s/^${prefix}-([0-9]+\.[0-9]+\.[0-9]+)$/\1/p" \
        | sort -V -r \
        | uniq
}

function print_valid_selector_help() {
    local selector="$1"
    local preview
    preview=$(list_valid_release_versions | head -n 8 | tr '\n' ',' | sed 's/,$//')

    echo "Invalid firmware selector '$selector' for $VEHICLE."
    echo "Valid selectors include: latest, stable, beta, <major.minor.patch>, <major.minor>."
    echo "Release tag format is $(vehicle_prefix)-<major.minor.patch> (e.g. $(vehicle_prefix)-4.6.2)."
    echo "Channel tag format is $(vehicle_channel_prefix)-stable and $(vehicle_channel_prefix)-beta."
    if [ -n "$preview" ]; then
        echo "Example available versions: $preview"
    fi
}

function resolve_remote_ref() {
    local release_prefix
    release_prefix=$(vehicle_prefix)
    local channel_prefix
    channel_prefix=$(vehicle_channel_prefix)
    local selector
    selector="${FIRMWARE_VERSION}"
    local selector_lc
    selector_lc="${selector,,}"
    local candidates=()

    if [ "$selector_lc" = "latest" ]; then
        candidates=(
            "refs/heads/master"
            "refs/heads/main"
        )
    elif [ "$selector_lc" = "stable" ] || [ "$selector_lc" = "beta" ]; then
        candidates=(
            "refs/tags/${channel_prefix}-${selector_lc}"
            "refs/heads/${channel_prefix}-${selector_lc}"
        )
    elif [[ "$selector" == refs/* ]]; then
        candidates=("$selector")
    elif [[ "$selector" =~ ^(Copter|Plane)-[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        candidates=("refs/tags/${selector}")
    elif [[ "$selector" =~ ^(ArduCopter|ArduPlane)-(stable|beta)$ ]]; then
        candidates=(
            "refs/tags/${selector}"
            "refs/heads/${selector}"
        )
    elif [[ "$selector" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        candidates=("refs/tags/${release_prefix}-${selector}")
    elif [[ "$selector" =~ ^[0-9]+\.[0-9]+$ ]]; then
        local matched_patch
        matched_patch=$(list_valid_release_versions | grep -E "^${selector}\." | head -n 1)
        if [ -n "$matched_patch" ]; then
            candidates=("refs/tags/${release_prefix}-${matched_patch}")
        fi
    else
        candidates=()
    fi

    if [ ${#candidates[@]} -eq 0 ]; then
        return 1
    fi

    for ref in "${candidates[@]}"; do
        if git ls-remote --exit-code "$REPO_URL" "$ref" >/dev/null 2>&1; then
            echo "$ref"
            return 0
        fi
    done

    return 1
}

function ensure_repo() {
    local repo_dir="$1"

    if [ ! -d "$repo_dir/.git" ]; then
        rm -rf "$repo_dir"
        git clone --recurse-submodules "$REPO_URL" "$repo_dir" >&2
    fi
}

function checkout_ref() {
    local repo_dir="$1"
    local ref="$2"
    local short_ref="${ref#refs/heads/}"
    local short_tag="${ref#refs/tags/}"

    cd "$repo_dir"

    if [[ "$ref" == refs/heads/* ]]; then
        git fetch origin "$short_ref" --depth 1 >&2
        git checkout -B "$short_ref" "origin/$short_ref" >&2
    else
        git fetch origin "tag" "$short_tag" --depth 1 >&2
        git checkout -f "$short_tag" >&2
    fi

    git submodule update --init --recursive >&2
}

function maybe_refresh_dynamic_ref() {
    local repo_dir="$1"
    local selector_lc
    selector_lc="${FIRMWARE_VERSION,,}"

    if [ "$selector_lc" = "latest" ] || [ "$selector_lc" = "stable" ]; then
        local resolved_ref
        if resolved_ref=$(resolve_remote_ref); then
            checkout_ref "$repo_dir" "$resolved_ref"
        else
            print_valid_selector_help "$FIRMWARE_VERSION"
            exit 1
        fi
    fi
}

function ensure_firmware_repo() {
    if is_pinned_firmware && [ -d "$CACHE_ROOT" ] && [ -w "$CACHE_ROOT" ]; then
        local key
        key="$(vehicle_prefix)-$(echo "$FIRMWARE_VERSION" | tr '/:' '__')"
        local repo_dir="$CACHE_ROOT/$key"

        if [ ! -d "$repo_dir/.git" ]; then
            ensure_repo "$repo_dir"
            local resolved_ref
            if resolved_ref=$(resolve_remote_ref); then
                checkout_ref "$repo_dir" "$resolved_ref"
            else
                print_valid_selector_help "$FIRMWARE_VERSION"
                exit 1
            fi
        fi

        echo "$repo_dir"
        return 0
    fi

    ensure_repo "$DEFAULT_WORKTREE"
    maybe_refresh_dynamic_ref "$DEFAULT_WORKTREE"
    echo "$DEFAULT_WORKTREE"
}

function ensure_vehicle_binary() {
    local repo_dir="$1"
    local binary_path=""

    if [ "$VEHICLE" = "ArduPlane" ]; then
        binary_path="$repo_dir/build/sitl/bin/arduplane"
    else
        binary_path="$repo_dir/build/sitl/bin/arducopter"
    fi

    if [ ! -x "$binary_path" ]; then
        cd "$repo_dir"
        ./waf configure --board sitl
        if [ "$VEHICLE" = "ArduPlane" ]; then
            ./waf plane
        else
            ./waf copter
        fi
    fi
}

PARAM_PATH="/sitl_setup/custom_params.parm"

if test -f "/sitl_setup/custom/custom_params.parm"; then
    PARAM_PATH="/sitl_setup/custom/custom_params.parm"
fi

for ARGUMENT in "$@"
do
   KEY=$(echo $ARGUMENT | cut -f1 -d=)

   KEY_LENGTH=${#KEY}
   VALUE="${ARGUMENT:$KEY_LENGTH+1}"

   export "$KEY"="$VALUE"
done

ARDUPILOT_DIR=$(ensure_firmware_repo)
if [ -z "$ARDUPILOT_DIR" ]; then
    print_valid_selector_help "$FIRMWARE_VERSION"
    exit 1
fi
ensure_vehicle_binary "$ARDUPILOT_DIR"

exec python /sitl_setup/mission_upload.py &
exec python "$ARDUPILOT_DIR/Tools/autotest/sim_vehicle.py" -v $VEHICLE --custom-location=$LAT,$LON,$ALT,$DIR --no-mavproxy --add-param-file=$PARAM_PATH
