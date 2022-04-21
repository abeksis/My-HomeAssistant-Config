"""Support for the Reverso TTS speech service."""
import logging
from pyttsreverso import pyttsreverso
import voluptuous as vol
from homeassistant.components.tts import CONF_LANG, PLATFORM_SCHEMA, Provider
import homeassistant.helpers.config_validation as cv

_LOGGER = logging.getLogger(__name__)

CONF_PITCH = "pitch"
CONF_BITRATE = "bitrate"

DEFAULT_LANG = "Sharon-US-English"
DEFAULT_PITCH = "100"
DEFAULT_BITRATE = "128k"

SUPPORTED_LANGUAGES = ['Leila-Arabic', 'Mehdi-Arabic', 'Nizar-Arabic', 'Salma-Arabic', 'Lisa-Australian-English',
                       'Tyler-Australian-English', 'Jeroen-Belgian-Dutch', 'Sofie-Belgian-Dutch', 'Zoe-Belgian-Dutch',
                       'Alice-BE-Belgian-French', 'Anais-BE-Belgian-French', 'Antoine-BE-Belgian-French',
                       'Bruno-BE-Belgian-French', 'Claire-BE-Belgian-French', 'Julie-BE-Belgian-French',
                       'Justine-Belgian-French', 'Manon-BE-Belgian-French', 'Margaux-BE-Belgian-French',
                       'Marcia-Brazilian', 'Graham-British', 'Lucy-British', 'Peter-British', 'QueenElizabeth-British',
                       'Rachel-British', 'Louise-Canadian-French', 'Laia-Catalan', 'Eliska-Czech', 'Mette-Danish',
                       'Rasmus-Danish', 'Daan-Dutch', 'Femke-Dutch', 'Jasmijn-Dutch', 'Max-Dutch',
                       'Samuel-Finland-Swedish', 'Sanna-Finnish', 'Alice-French', 'Anais-French', 'Antoine-French',
                       'Bruno-French', 'Claire-French', 'Julie-French', 'Manon-French', 'Margaux-French',
                       'Andreas-German', 'Claudia-German', 'Julia-German', 'Klaus-German', 'Sarah-German',
                       'Kal-Gothenburg-Swedish', 'Dimitris-Greek', 'he-IL-Asaf-Hebrew', 'Deepa-Indian-English',
                       'Chiara-Italian', 'Fabiana-Italian', 'Vittorio-Italian', 'Sakura-Japanese', 'Minji-Korean',
                       'Lulu-Mandarin-Chinese', 'Bente-Norwegian', 'Kari-Norwegian', 'Olav-Norwegian', 'Ania-Polish',
                       'Monika-Polish', 'Celia-Portuguese', 'ro-RO-Andrei-Romanian', 'Alyona-Russian', 'Mia-Scanian',
                       'Antonio-Spanish', 'Ines-Spanish', 'Maria-Spanish', 'Elin-Swedish', 'Emil-Swedish',
                       'Emma-Swedish', 'Erik-Swedish', 'Ipek-Turkish', 'Heather-US-English', 'Karen-US-English',
                       'Kenny-US-English', 'Laura-US-English', 'Micah-US-English', 'Nelly-US-English', 'Rod-US-English',
                       'Ryan-US-English', 'Saul-US-English', 'Sharon-US-English', 'Tracy-US-English', 'Will-US-English',
                       'Rodrigo-US-Spanish', 'Rosa-US-Spanish']

PLATFORM_SCHEMA = PLATFORM_SCHEMA.extend(
    {
        vol.Optional(CONF_LANG, default=DEFAULT_LANG): vol.In(SUPPORTED_LANGUAGES),
        vol.Optional(CONF_PITCH, default=DEFAULT_PITCH): cv.string,
        vol.Optional(CONF_BITRATE, default=DEFAULT_BITRATE): cv.string,
    }
)


def get_engine(hass, config, discovery_info=None):
    """Set up Reverso speech component."""
    return ReversoProvider(
        config[CONF_LANG],
        config[CONF_PITCH],
        config[CONF_BITRATE],
    )


class ReversoProvider(Provider):
    """The Reverso TTS API provider."""

    def __init__(self, lang, pitch, bitrate):
        """Initialize Reverso TTS provider."""
        self._lang = lang
        self._pitch = pitch
        self._bitrate = bitrate
        self.name = "ReversoTTS"

    @property
    def default_language(self):
        """Return the default language."""
        return self._lang

    @property
    def supported_languages(self):
        """Return list of supported languages."""
        return SUPPORTED_LANGUAGES

    def get_tts_audio(self, message, language, options=None):
        """Load TTS using pyttsreverso."""
        if language is None:
            language = self._lang
        try:
            convert = pyttsreverso.ReversoTTS()
            data = convert.convert_text(voice=language, pitch=self._pitch, bitrate=self._bitrate, msg=message)
        except Exception as e:
            _LOGGER.error("Error while to convert: %s", str(e))
            return (None, None)
        return ("mp3", data)
      
