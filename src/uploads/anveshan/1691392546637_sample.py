import requests
import time
import json
import base64
import pytz
import logging
import datetime
import pullover

# Constants
client_id = "f4079d438e9645439f8206929f1f30c2"
client_secret = "f65dd27ade1c47ea880e08885de2292e"
access_token = None
refresh_token = None

#pushover
push_api = 'atgy1drx2fq69cq6iyv6spxq5okgzi'
push_user = 'u8kkzucgqmfysi4x6hoy2kvgfc3iam'

# API Endpoints
auth_url = "https://accounts.spotify.com/api/token"
playlists_url = "https://api.spotify.com/v1/users/{user_id}/playlists?limit=50"
tracks_url = "https://api.spotify.com/v1/playlists/{playlist_id}/tracks"

class Formatter(logging.Formatter):
    """override logging.Formatter to use an aware datetime object"""
    def converter(self, timestamp):
        dt = datetime.datetime.fromtimestamp(timestamp)
        tzinfo = pytz.timezone('Asia/Kolkata')
        return tzinfo.localize(dt)
        
    def formatTime(self, record, datefmt=None):
        dt = self.converter(record.created)
        if datefmt:
            s = dt.strftime(datefmt)
        else:
            try:
                s = dt.isoformat(timespec='milliseconds')
            except TypeError:
                s = dt.isoformat()
        return s

logger = logging.getLogger(__name__)
logger.setLevel(logging.WARNING)

# Create a file handler to log the messages to a file
file_handler = logging.FileHandler("playlist_changes.log")
file_handler.setLevel(logging.WARNING)
file_handler.setFormatter(Formatter("%(asctime)s %(message)s"))
logger.addHandler(file_handler)

# Create a stream handler to log the messages to the terminal
stream_handler = logging.StreamHandler()
stream_handler.setLevel(logging.WARNING)
stream_handler.setFormatter(Formatter("%(asctime)s %(message)s", datefmt="%Y-%m-%d %H:%M:%S"))
logger.addHandler(stream_handler)

# Get the access and refresh tokens
def get_tokens():
    auth_data = {
        "grant_type": "client_credentials"
    }
    auth_header = {
        "Authorization": f"Basic {base64.b64encode(f'{client_id}:{client_secret}'.encode()).decode()}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    auth_response = requests.post(auth_url, data=auth_data, headers=auth_header)

    if auth_response.status_code == 200:
        auth_json = auth_response.json()
        # print(auth_json)
        access_token = auth_json["access_token"]
        # refresh_token = auth_json["refresh_token"]

    return access_token

# Get all public playlists for a user
def get_all_playlists(user_id, access_token, limit=50):
    playlists = []
    next_url = f"https://api.spotify.com/v1/users/{user_id}/playlists?limit={limit}"

    while next_url:
        playlists_header = {
            "Authorization": f"Bearer {access_token}"
        }
        playlists_response = requests.get(next_url, headers=playlists_header)

        if playlists_response.status_code == 200:
            playlists_json = playlists_response.json()
            for playlist in playlists_json["items"]:
                if playlist["owner"]["id"] == user_id:
                    playlists.append(playlist["id"])
            # playlists.extend(playlists_json["items"])
            next_url = playlists_json.get("next")
        else:
            print(playlists_response.headers)
            raise Exception("Could not retrieve playlists")

    return playlists

# Get all tracks for a playlist
def get_all_tracks(playlist_id, access_token):
    tracks = []
    description = ""
    next_url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?fields=items(added_by.id, added_at,track(id,name,artists(name),type))"

    while next_url:
        tracks_header = {
            "Authorization": f"Bearer {access_token}"
        }
        tracks_response = requests.get(next_url, headers=tracks_header)

        if tracks_response.status_code == 200:
            tracks_json = tracks_response.json()
            tracks.extend(tracks_json["items"])
            next_url = tracks_json.get("next")
        else:
            print(tracks_response.headers)
            raise Exception("Could not retrieve tracks")

    playlist_header = {
        "Authorization": f"Bearer {access_token}"
    }
    playlist_response = requests.get(f"https://api.spotify.com/v1/playlists/{playlist_id}", headers=playlist_header)

    if playlist_response.status_code == 200:
        playlist_json = playlist_response.json()
        description = playlist_json.get("description")
        name = playlist_json.get("name")
    else:
        print(playlist_response.headers)
        raise Exception("Could not retrieve playlist description")

    return {
        "name": name,
        "description": description,
        "tracks": tracks,
        "deleted": []
    }

def check_changes(playlist_id, playlist, prev_playlists):
    if playlist_id not in prev_playlists:
        prev_playlists[playlist_id] = playlist

        message = f"playlist with id {playlist_id} was not stored before, name: {playlist['name']}"
        logger.warning(message)
        pullover.send(message, push_user, push_api)
        return

    prev_playlist = prev_playlists[playlist_id]

    # Check if the title has been changed
    if playlist["name"] != prev_playlist["name"]:
        message = f"Title changed from {prev_playlist['name']} to {playlist['name']} in playlist {playlist_id}"
        logger.warning(message)
        pullover.send(message, push_user, push_api)

    # Check if the description has been changed
    if playlist.get("description") != prev_playlist.get("description"):
        message = f"Description changed from {prev_playlist.get('description')} to {playlist.get('description')} with playlist name {playlist['name']}"
        logger.warning(message)
        pullover.send(message, push_user, push_api)

    # Check if any song has been deleted
    prev_tracks = set()
    curr_tracks = set()
    # prev_tracks = set(track["track"]["name"] + ' by ' + track["track"]["artists"]["name"] for track in prev_playlist["tracks"])
    for track in prev_playlist["tracks"]:
        if len(track) != 0 and track["track"] is not None:
            prev_tracks.update(set([track["track"]["name"] + ' by ' + track["track"]["artists"][0]["name"]]))
    for track in playlist["tracks"]:
        if len(track) != 0 and track["track"] is not None:
            curr_tracks.update(set([track["track"]["name"] + ' by ' + track["track"]["artists"][0]["name"]]))
    # curr_tracks = set(track["track"]["name"] + ' by ' + track["track"]["artists"]["name"] for track in playlist["tracks"])
    deleted_tracks = prev_tracks - curr_tracks
    # Check if any song has been added
    added_tracks = curr_tracks - prev_tracks

    prev_playlists[playlist_id] = playlist

    for deleted_track in deleted_tracks:
        prev_playlists[playlist_id]["deleted"].append(deleted_track)

        message = f"Track {deleted_track} deleted from playlist {playlist['name']}"
        logger.warning(message)
        pullover.send(message, push_user, push_api)
    for added_track in added_tracks:
        message = f"Track {added_track} added to playlist {playlist['name']}"
        logger.warning(message)
        pullover.send(message, push_user, push_api)


# Main function
def main(user_id):
    # logging.basicConfig(filename='playlist_changes.log', level=logging.info,
    #                 format='%(asctime)s %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

    # Get all public playlists
    # playlist_ids = get_all_playlists(user_id, access)

    # all_ids = {
    #     "public": playlist_ids,
    #     "exempt" : ["7BwGAgd6ckll5TvnZ5WHdX"]
    # }

    # all_tracks = {}
    # for playlist_id in playlist_ids:
    #     all_tracks[playlist_id] = get_all_tracks(playlist_id, access)


    # with open('test_ids.json', 'w') as outfile:
    #     json.dump(all_ids, outfile)
    # with open('test_tracks.json', 'w') as outfile:
    #     json.dump(all_tracks, outfile)
    
    with open("test_ids.json", "r") as file:
        all_ids = json.load(file)
    with open("test_tracks.json", "r") as file:
        all_tracks = json.load(file)

    # i = 0
    # access = get_tokens()
    while True:
        # if i == 14:
        access = get_tokens()
            # i = 0
        new_playlist_ids = get_all_playlists(user_id, access)

        added_playlists = set(new_playlist_ids) - set(all_ids["public"])
        removed_playlists = set(all_ids["public"]) - set(new_playlist_ids)

        if added_playlists:
            new = list(added_playlists)
            all_ids["public"].extend(new)

            message = f"Playlists added: {list(added_playlists)}"
            logger.warning(message)
            pullover.send(message, push_user, push_api)
            with open('test_ids.json', 'w') as outfile:
                json.dump(all_ids, outfile)

        if removed_playlists:
            all_ids["exempt"].extend(list(removed_playlists))
            all_ids["public"] = new_playlist_ids

            message = f"Playlists removed: {list(removed_playlists)}"
            logger.warning(message)
            pullover.send(message, push_user, push_api)
            with open('test_ids.json', 'w') as outfile:
                json.dump(all_ids, outfile)

        all_ids["public"] = new_playlist_ids

        all_playlist_ids = sum(all_ids.values(), [])

        for playlist_id in all_playlist_ids:
            playlist = get_all_tracks(playlist_id, access)
            check_changes(playlist_id, playlist, all_tracks)

        with open('test_tracks.json', 'w') as outfile:
                json.dump(all_tracks, outfile)

        # i += 1

        print('done')
        time.sleep(60)
        




    # Store the initial state of each playlist
    # playlist_tracks = {}
    # for playlist_id in playlist_ids:
    #     playlist_tracks[playlist_id] = get_all_tracks(playlist_id, access)

    # # x = get_all_tracks('6jfn0GUAuDMU7JJLNjelj1', access)

    # with open('bhumika.json', 'w') as outfile:
    #     json.dump(playlist_tracks, outfile)

    # Continuously check for updates
    # while True:
    #     time.sleep(300)  # wait for 5 minutes

    #     # Get all public playlists
    #     playlists = get_playlists(user_id)

main("2bnjbr96v3lsnzzzfho3whi5i")
# main("22wymhkx4dhtx6jjnyyru2rpa")