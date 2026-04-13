"""Profile schema validation tests — run without a live backend."""

import json
from pathlib import Path

import pytest

PROFILES_PATH = Path(__file__).parent.parent / "profiles.json"


@pytest.fixture
def profiles():
    with open(PROFILES_PATH) as f:
        return json.load(f)


class TestProfileSchema:
    def test_profiles_is_dict(self, profiles: dict):
        assert isinstance(profiles, dict)
        assert len(profiles) > 0

    def test_required_profiles_exist(self, profiles: dict):
        assert "aligner" in profiles
        assert "texplitter" in profiles
        assert "generic" in profiles

    @pytest.mark.parametrize("name", ["aligner", "texplitter", "generic"])
    def test_profile_has_required_fields(self, profiles: dict, name: str):
        p = profiles[name]
        assert "title" in p
        assert "description" in p
        assert "files" in p
        assert "metadata" in p
        assert "destination" in p

    @pytest.mark.parametrize("name", ["aligner", "texplitter", "generic"])
    def test_file_fields_valid(self, profiles: dict, name: str):
        for f in profiles[name]["files"]:
            assert "name" in f
            assert "label" in f
            assert "accept" in f
            assert "required" in f
            assert isinstance(f["required"], bool)

    @pytest.mark.parametrize("name", ["aligner", "texplitter", "generic"])
    def test_metadata_fields_valid(self, profiles: dict, name: str):
        for m in profiles[name]["metadata"]:
            assert "name" in m
            assert "label" in m
            assert "type" in m
            assert m["type"] in ("text", "select")
            if m["type"] == "select":
                assert "options" in m
                assert len(m["options"]) > 0

    def test_aligner_has_two_files(self, profiles: dict):
        assert len(profiles["aligner"]["files"]) == 2

    def test_texplitter_has_one_file(self, profiles: dict):
        assert len(profiles["texplitter"]["files"]) == 1

    def test_generic_supports_multiple(self, profiles: dict):
        generic_file = profiles["generic"]["files"][0]
        assert generic_file.get("multiple") is True
