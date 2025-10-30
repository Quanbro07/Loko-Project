def get_preferred_tags(choice):
    tag_map = {
        1: ["restaurant", "street-food", "market"],
        2: ["amusement", "shopping", "zoo", "stadium", "park", "kid", "family"],
        3: ["trekking", "camping", "diving", "watersport", "mountain", "cave", "waterfall", "dangerous"],
        4: ["viewpoint", "landmark", "bridge", "tower", "statue", "garden", "nature", "beach", "island", "zoo"],
        5: ["museum", "palace", "fortress", "temple", "pagoda", "cathedral", "religion", "village", "landmark"],
        6: ["hotel", "resort", "homestay", "spa", "beach", "island", "nature"],
        7: ["couple", "hotel", "homestay", "resort", "beach", "island", "yacht / cruise", "viewpoint", "garden"],
        8: ["night-spot", "harbor", "square", "shopping", "trendy"],
        9: ["beach", "island", "harbor", "diving", "watersport", "yacht / cruise"]
    }
    return tag_map.get(choice, [])
